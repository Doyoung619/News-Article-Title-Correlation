from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer, util
from flask_cors import CORS
import torch

app = Flask(__name__)
CORS(app)  # CORS 허용
model = SentenceTransformer('paraphrase-MiniLM-L6-v2')  # 작고 빠름

@app.route('/')
def index():
    return jsonify({'status': 'Server is running'})

@app.route('/similarity', methods=['POST'])
def similarity():
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    if not title or not content:
        return jsonify({'error': 'Missing input'}), 400

    embeddings = model.encode([title, content], convert_to_tensor=True)
    score = util.pytorch_cos_sim(embeddings[0], embeddings[1]).item()
    return jsonify({'score': score})

if __name__ == '__main__':
    app.run(port=8000)