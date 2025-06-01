# News-Article-Title-Correlation

이 프로젝트는 다음 뉴스에서, 뉴스 본문과 제목간 일치도를 시각화 해주어, 일치도가 낮은 기사의 경우 하이라이트를 함으로 어그로성/낚시성 기사를 유저로 하여금 보지 않도록 권장하는 서비스를 제공하고자 기획되었다.


동작 가능한 링크 -->

https://entertain.daum.net/

https://news.daum.net/


시연샷 :
뉴스 홈
![image](https://github.com/user-attachments/assets/efd746f3-1eb6-420e-892d-b8d9ed017464)
기사 들어갔을떄
![image](https://github.com/user-attachments/assets/7017e58a-c976-4625-8628-3c5ea3b714c7)


사용 방법 : 
1. 폴더를 다운받고, chrome://extensions --> 압축해제된 확장 프로그램을 로드합니다 --> 폴더 업로드 및 개발자 모드 on
2. VS코드 터미널 상에서, 폴더 경로에 들간뒤 python local_similarity_server.py 터미널에 입력 (필요한 라이브러리는 pip install로 받을 수 있다. flas, sentence_transformers, flask_cors, torch를 사용하였음을 밝힌다)
3. 이후 다음 뉴스홈에 들어가서, 구동을 확인할 수 있다.
