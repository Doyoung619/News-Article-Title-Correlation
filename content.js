async function analyzeArticle(title, content) {
  try {
    console.log("Sending request to server with:", { title, content });
    const response = await fetch("http://localhost:8000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Server response:", data);
    
    if (data.status === 'error') {
      throw new Error(data.error || 'Unknown error from server');
    }
    
    return data;
  } catch (e) {
    console.error("서버 통신 실패:", e);
    return {
      clickbait_score: 0,
      ad_score: 0
    };
  }
}

function insertAnalysisBar(clickbaitScore, adScore) {
  const container = document.createElement("div");
  container.style.margin = "16px 0";
  container.style.padding = "10px";
  container.style.backgroundColor = "#f0f0f0";
  container.style.border = "1px solid #ccc";
  container.style.borderRadius = "4px";

  // 낚시성 점수 표시
  const clickbaitContainer = document.createElement("div");
  clickbaitContainer.style.marginBottom = "12px";
  
  const clickbaitText = document.createElement("div");
  clickbaitText.innerText = `낚시성 점수: ${(clickbaitScore * 100).toFixed(1)}%`;
  clickbaitText.style.marginBottom = "4px";
  clickbaitText.style.fontWeight = "bold";
  clickbaitContainer.appendChild(clickbaitText);

  const clickbaitBarWrapper = document.createElement("div");
  clickbaitBarWrapper.style.height = "8px";
  clickbaitBarWrapper.style.background = "#ddd";
  clickbaitBarWrapper.style.borderRadius = "4px";
  clickbaitBarWrapper.style.overflow = "hidden";

  const clickbaitBar = document.createElement("div");
  clickbaitBar.style.height = "100%";
  clickbaitBar.style.width = `${clickbaitScore * 100}%`;
  clickbaitBar.style.background = clickbaitScore > 0.7 ? "#f44336" : clickbaitScore > 0.4 ? "#ff9800" : "#4caf50";
  clickbaitBar.style.transition = "width 0.3s ease-in-out";

  clickbaitBarWrapper.appendChild(clickbaitBar);
  clickbaitContainer.appendChild(clickbaitBarWrapper);
  container.appendChild(clickbaitContainer);

  // 광고성 점수 표시
  const adContainer = document.createElement("div");
  
  const adText = document.createElement("div");
  adText.innerText = `광고성 점수: ${(adScore * 100).toFixed(1)}%`;
  adText.style.marginBottom = "4px";
  adText.style.fontWeight = "bold";
  adContainer.appendChild(adText);

  const adBarWrapper = document.createElement("div");
  adBarWrapper.style.height = "8px";
  adBarWrapper.style.background = "#ddd";
  adBarWrapper.style.borderRadius = "4px";
  adBarWrapper.style.overflow = "hidden";

  const adBar = document.createElement("div");
  adBar.style.height = "100%";
  adBar.style.width = `${adScore * 100}%`;
  adBar.style.background = adScore > 0.7 ? "#f44336" : adScore > 0.4 ? "#ff9800" : "#4caf50";
  adBar.style.transition = "width 0.3s ease-in-out";

  adBarWrapper.appendChild(adBar);
  adContainer.appendChild(adBarWrapper);
  container.appendChild(adContainer);

  // 네이버 뉴스 홈에서 제목 요소 찾기
  const titleEl = document.querySelector("h2#title_area") || 
                 document.querySelector(".news_title") || 
                 document.querySelector(".article_title");
                 
  if (titleEl) {
    titleEl.parentNode.insertBefore(container, titleEl.nextSibling);
  } else {
    console.warn("제목 요소를 찾을 수 없습니다.");
  }
}

// 메인 페이지 도메인 체크
const isMainPage = (url) => {
    return url.includes('entertain.daum.net') || url.includes('v.daum.net');
};

// 유사도 점수에 따른 색상 설정 (동그라미용)
const getColorByScore = (score) => {
    if (score < 0.77) return '#ff0000'; // 빨간색 - 매우 낮은 유사도
    if (score < 0.85) return '#ff9800'; // 주황색 - 중간 유사도
    return '#4caf50'; // 초록색 - 높은 유사도
};

// 하이라이트 색상 설정 (하이라이트용)
const getHighlightColor = (score) => {
    // 유사도가 낮은 경우에만 빨간색 하이라이트
    return score < 0.77 ? 'rgba(255, 0, 0, 0.2)' : null;
};

// 유사도 표시 동그라미 생성
const createSimilarityCircle = (score) => {
    const circle = document.createElement('span');
    const color = getColorByScore(score);
    const scoreText = Math.round(score * 100);
    
    circle.style.display = 'inline-block';
    circle.style.width = '24px';
    circle.style.height = '24px';
    circle.style.borderRadius = '50%';
    circle.style.backgroundColor = color;
    circle.style.color = 'white';
    circle.style.fontSize = '12px';
    circle.style.fontWeight = 'bold';
    circle.style.textAlign = 'center';
    circle.style.lineHeight = '24px';
    circle.style.marginLeft = '8px';
    circle.style.verticalAlign = 'middle';
    circle.style.cursor = 'help';
    circle.textContent = scoreText;
    circle.classList.add('similarity-circle'); // 동그라미 식별을 위한 클래스 추가
    
    return circle;
};

// 제목에 유사도 표시 추가
const addSimilarityIndicator = (titleElement, score) => {
    const color = getHighlightColor(score);
    if (color) {
        titleElement.style.backgroundColor = color;
        titleElement.style.padding = '2px 4px';
        titleElement.style.borderRadius = '3px';
    }
    titleElement.title = `제목-본문 유사도: ${(score * 100).toFixed(1)}%`;
};

// 본문 내용 가져오기
const getArticleContent = async (doc = document) => {
    try {
        console.log('본문 가져오기 시작');
        
        // 본문이 로드될 때까지 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 다음 뉴스 본문 선택자
        const selectors = [
            '#article_view',
            '.article_view',
            '.article_txt',
            '#articleBody',
            '.article_body',
            '.news_view',
            '.news_body',
            '.news_article',
            '.article_cont',
            '.view_cont'
        ];
        
        let content = null;
        for (const selector of selectors) {
            const element = doc.querySelector(selector);
            if (element) {
                console.log('본문 찾음:', selector);
                content = element;
                break;
            }
        }
        
        if (!content) {
            console.warn('본문을 찾을 수 없습니다');
            return '';
        }
        
        const text = content.textContent.trim();
        console.log('본문 길이:', text.length);
        return text;
    } catch (error) {
        console.error('본문 가져오기 실패:', error);
        return '';
    }
};

// 유사도 계산 요청
const calculateSimilarity = async (title, abstract) => {
    try {
        const response = await fetch('http://localhost:8000/similarity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, content: abstract })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.score;
    } catch (error) {
        console.error('유사도 계산 실패:', error);
        return null;
    }
};

// 이미 처리된 링크를 추적하는 Set
const processedLinks = new Set();

// 툴팁 스타일 추가
const addTooltipStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        .similarity-tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            pointer-events: none;
            white-space: nowrap;
            transform: translateY(-100%);
            margin-top: -5px;
        }
    `;
    document.head.appendChild(style);
};

// 툴팁 생성 및 관리
const createTooltip = () => {
    const tooltip = document.createElement('div');
    tooltip.className = 'similarity-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
    return tooltip;
};

// 툴팁 표시
const showTooltip = (tooltip, element, similarity) => {
    const rect = element.getBoundingClientRect();
    const score = Math.round(similarity * 100);
    
    // 동그라미인 경우에만 상세 툴팁 표시
    if (element.classList.contains('similarity-circle')) {
        const message = `제목과 본문 간 일치율\n\n` +
                       `(🟢) 높음: 85점~100점\n` +
                       `(🟠) 중간: 77점~84점\n` +
                       `(🔴) 낮음: 0점~76점\n\n` +
                       `현재 점수: ${score}점`;
        
        tooltip.textContent = message;
        tooltip.style.padding = '8px';
        tooltip.style.fontSize = '13px';
    } else {
        // 다른 요소들은 점수만 표시
        tooltip.textContent = `제목-본문 유사도: ${score}점`;
        tooltip.style.padding = '5px 10px';
        tooltip.style.fontSize = '12px';
    }
    
    tooltip.style.display = 'block';
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.top = `${rect.top + window.scrollY}px`;
    tooltip.style.whiteSpace = 'pre-line';
};

// 툴팁 숨기기
const hideTooltip = (tooltip) => {
    tooltip.style.display = 'none';
};

// 메인 실행 함수
const main = async () => {
    console.log('확장 프로그램 시작');
    
    // 툴팁 스타일 및 요소 추가
    addTooltipStyles();
    const tooltip = createTooltip();
    
    // 현재 페이지가 기사 본문 페이지인지 확인
    const isArticlePage = window.location.href.includes('v.daum.net/v/') || 
                         window.location.href.includes('news.daum.net/article/');
    
    if (isArticlePage) {
        console.log('기사 본문 페이지 감지됨');
        // 기사 본문 페이지 처리
        await processArticlePage(tooltip);
    } else {
        // 검색 결과 처리
        await processSearchResults(tooltip);
    }
    
    // DOM 변경 감지 설정
    setupMutationObserver(tooltip);
};

// 페이지 로드 완료 후 실행
if (document.readyState === 'complete') {
    main();
} else {
    window.addEventListener('load', main);
}

// 새로 추가된 뉴스 링크만 처리하는 함수
const processNewNewsLinks = async (container, tooltip) => {
    const newsLinkSelectors = [
        // 다음 뉴스/연예 홈페이지 실제 선택자
        'a[href*="v.daum.net/v/"]',
        'a[href*="news.daum.net/article/"]',
        '.box_news a[href*="v.daum.net/v/"]',
        '.box_news a[href*="news.daum.net/article/"]',
        '.item_news a[href*="v.daum.net/v/"]',
        '.item_news a[href*="news.daum.net/article/"]',
        '.list_news a[href*="v.daum.net/v/"]',
        '.list_news a[href*="news.daum.net/article/"]',
        '.c_item a[href*="v.daum.net/v/"]',
        '.c_item a[href*="news.daum.net/article/"]',
        '.news_item a[href*="v.daum.net/v/"]',
        '.news_item a[href*="news.daum.net/article/"]',
        '.news_cont a[href*="v.daum.net/v/"]',
        '.news_cont a[href*="news.daum.net/article/"]',
        // 연예 뉴스 추가 선택자
        '.tit_news a',
        '.tit_thumb a',
        '.tit_g a',
        '.link_news',
        '.link_article',
        '.link_txt',
        '.box_headline a',
        '.box_headline .tit_news',
        '.box_headline .tit_thumb',
        '.box_headline .tit_g',
        '.box_thumb a',
        '.box_thumb .tit_news',
        '.box_thumb .tit_thumb',
        '.box_thumb .tit_g',
        // 연예 뉴스 특화 선택자
        '.box_entertain a',
        '.box_entertain .tit_news',
        '.box_entertain .tit_thumb',
        '.box_entertain .tit_g',
        '.item_entertain a',
        '.item_entertain .tit_news',
        '.item_entertain .tit_thumb',
        '.item_entertain .tit_g',
        '.list_entertain a',
        '.list_entertain .tit_news',
        '.list_entertain .tit_thumb',
        '.list_entertain .tit_g'
    ];
    
    // 변경된 컨테이너 내의 새로운 링크만 선택
    const newLinks = container.querySelectorAll(newsLinkSelectors.join(','));
    console.log('새로 추가된 뉴스 링크 수:', newLinks.length);
    
    for (const link of newLinks) {
        // 이미 처리된 링크는 건너뛰기
        if (processedLinks.has(link.href)) {
            continue;
        }
        
        // 다음 뉴스 기사 URL 패턴 확인
        if (link.href && (
            link.href.includes('v.daum.net/v/') || 
            link.href.includes('news.daum.net/article/')
        )) {
            try {
                console.log('새로운 기사 처리 시작:', link.href);
                // 기사 제목 가져오기
                const title = link.textContent.trim();
                if (!title) {
                    console.log('제목을 찾을 수 없음:', link);
                    continue;
                }
                console.log('제목 찾음:', title);

                // 기사 내용 가져오기
                console.log('기사 내용 가져오기 시작');
                const response = await fetch(link.href);
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                const contentSelectors = [
                    '#article_view',
                    '.article_view',
                    '.article_txt',
                    '#articleBody',
                    '.article_body',
                    '.news_view',
                    '.news_body'
                ];
                
                let content = null;
                for (const selector of contentSelectors) {
                    const element = doc.querySelector(selector);
                    if (element) {
                        content = element.textContent.trim();
                        console.log('본문 찾음:', selector);
                        break;
                    }
                }
                
                if (!content) {
                    console.log('본문을 찾을 수 없음');
                    continue;
                }
                
                // 유사도 계산
                console.log('유사도 계산 시작');
                const similarity = await calculateSimilarity(title, content);
                if (similarity !== null) {
                    console.log('유사도 계산 완료:', similarity);
                    // 링크에 유사도 표시
                    link.style.backgroundColor = getHighlightColor(similarity);
                    link.style.padding = '2px 4px';
                    link.style.borderRadius = '3px';
                    
                    // 마우스 이벤트 핸들러 추가
                    link.addEventListener('mouseenter', () => {
                        showTooltip(tooltip, link, similarity);
                    });
                    link.addEventListener('mouseleave', () => {
                        hideTooltip(tooltip);
                    });
                    
                    // 처리된 링크로 표시
                    processedLinks.add(link.href);
                }
            } catch (error) {
                console.error('기사 처리 실패:', error);
            }
        }
    }
};

// 메인 페이지인 경우
const processNewsLinks = async (tooltip) => {
    const newsLinkSelectors = [
        // 메인 뉴스
        '.item_news a',
        '.item_news .tit_news',
        '.item_news .tit_thumb',
        '.item_news .tit_g',
        // 섹션 뉴스
        '.box_news a',
        '.box_news .tit_news',
        '.box_news .tit_thumb',
        '.box_news .tit_g',
        // 리스트 뉴스
        '.list_news a',
        '.list_news .tit_news',
        '.list_news .tit_thumb',
        '.list_news .tit_g',
        // 일반 링크
        'a.link_txt',
        'a.link_news',
        'a.link_article',
        // 기타 선택자
        '.tit_news a',
        '.tit_thumb a',
        '.tit_g a',
        '.tit_news',
        '.tit_thumb',
        '.tit_g',
        // 새로운 선택자 추가
        '.c_item a',
        '.c_item .tit_news',
        '.c_item .tit_thumb',
        '.c_item .tit_g',
        '.news_item a',
        '.news_item .tit_news',
        '.news_item .tit_thumb',
        '.news_item .tit_g',
        '.news_cont a',
        '.news_cont .tit_news',
        '.news_cont .tit_thumb',
        '.news_cont .tit_g',
        // 다음 뉴스/연예 홈페이지 실제 선택자
        'a[href*="v.daum.net/v/"]',
        'a[href*="news.daum.net/article/"]',
        '.box_news a[href*="v.daum.net/v/"]',
        '.box_news a[href*="news.daum.net/article/"]',
        '.item_news a[href*="v.daum.net/v/"]',
        '.item_news a[href*="news.daum.net/article/"]',
        '.list_news a[href*="v.daum.net/v/"]',
        '.list_news a[href*="news.daum.net/article/"]',
        // 연예 뉴스 추가 선택자
        '.box_entertain a',
        '.box_entertain .tit_news',
        '.box_entertain .tit_thumb',
        '.box_entertain .tit_g',
        '.item_entertain a',
        '.item_entertain .tit_news',
        '.item_entertain .tit_thumb',
        '.item_entertain .tit_g',
        '.list_entertain a',
        '.list_entertain .tit_news',
        '.list_entertain .tit_thumb',
        '.list_entertain .tit_g',
        // 추가 선택자
        '.box_thumb a',
        '.box_thumb .tit_news',
        '.box_thumb .tit_thumb',
        '.box_thumb .tit_g',
        '.box_headline a',
        '.box_headline .tit_news',
        '.box_headline .tit_thumb',
        '.box_headline .tit_g',
        // 관련 기사 선택자 추가
        '.box_related a',
        '.box_related .tit_news',
        '.box_related .tit_thumb',
        '.box_related .tit_g',
        '.related_news a',
        '.related_news .tit_news',
        '.related_news .tit_thumb',
        '.related_news .tit_g',
        '.box_news_related a',
        '.box_news_related .tit_news',
        '.box_news_related .tit_thumb',
        '.box_news_related .tit_g',
        '.box_news_side a',
        '.box_news_side .tit_news',
        '.box_news_side .tit_thumb',
        '.box_news_side .tit_g',
        '.box_news_recommend a',
        '.box_news_recommend .tit_news',
        '.box_news_recommend .tit_thumb',
        '.box_news_recommend .tit_g',
        '.box_news_other a',
        '.box_news_other .tit_news',
        '.box_news_other .tit_thumb',
        '.box_news_other .tit_g'
    ];
    
    console.log('선택자로 검색 시작');
    const newsLinks = document.querySelectorAll(newsLinkSelectors.join(','));
    console.log('찾은 뉴스 링크 수:', newsLinks.length);
    
    for (const link of newsLinks) {
        // 이미 처리된 링크는 건너뛰기
        if (processedLinks.has(link.href)) {
            continue;
        }
        
        // 다음 뉴스 기사 URL 패턴 확인
        if (link.href && (
            link.href.includes('v.daum.net/v/') || 
            link.href.includes('news.daum.net/article/')
        )) {
            try {
                console.log('기사 처리 시작:', link.href);
                // 기사 제목 가져오기
                const title = link.textContent.trim();
                if (!title) {
                    console.log('제목을 찾을 수 없음:', link);
                    continue;
                }
                console.log('제목 찾음:', title);

                // 기사 내용 가져오기
                console.log('기사 내용 가져오기 시작');
                const response = await fetch(link.href);
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                const contentSelectors = [
                    '#article_view',
                    '.article_view',
                    '.article_txt',
                    '#articleBody',
                    '.article_body',
                    '.news_view',
                    '.news_body'
                ];
                
                let content = null;
                for (const selector of contentSelectors) {
                    const element = doc.querySelector(selector);
                    if (element) {
                        content = element.textContent.trim();
                        console.log('본문 찾음:', selector);
                        break;
                    }
                }
                
                if (!content) {
                    console.log('본문을 찾을 수 없음');
                    continue;
                }
                
                // 유사도 계산
                console.log('유사도 계산 시작');
                const similarity = await calculateSimilarity(title, content);
                if (similarity !== null) {
                    console.log('유사도 계산 완료:', similarity);
                    // 링크에 유사도 표시
                    link.style.backgroundColor = getHighlightColor(similarity);
                    link.style.padding = '2px 4px';
                    link.style.borderRadius = '3px';
                    
                    // 마우스 이벤트 핸들러 추가
                    link.addEventListener('mouseenter', () => {
                        showTooltip(tooltip, link, similarity);
                    });
                    link.addEventListener('mouseleave', () => {
                        hideTooltip(tooltip);
                    });
                    
                    // 처리된 링크로 표시
                    processedLinks.add(link.href);
                }
            } catch (error) {
                console.error('기사 처리 실패:', error);
            }
        }
    }
};

// DOM 변경 감지를 위한 MutationObserver 설정
const setupMutationObserver = (tooltip) => {
    console.log('MutationObserver 설정 시작');
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                console.log('DOM 변경 감지됨');
                // 새로운 노드가 추가되었을 때 약간의 지연 후 처리
                setTimeout(() => {
                    processNewNewsLinks(mutation.target, tooltip);
                    // 관련 기사 컨테이너도 처리
                    const relatedContainers = document.querySelectorAll('.box_related, .related_news, .box_news_related, .box_news_side, .box_news_recommend, .box_news_other');
                    relatedContainers.forEach(container => {
                        processNewNewsLinks(container, tooltip);
                    });
                }, 1000); // 1초 대기
                break;
            }
        }
    });

    // 전체 문서를 관찰
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('MutationObserver 설정 완료');
};

// 논문 항목 처리
const processPaperItem = async (item, tooltip) => {
    try {
        // 제목 찾기
        const titleElement = item.querySelector('h3.gs_rt');
        if (!titleElement) {
            console.log('제목을 찾을 수 없음');
            return;
        }
        const title = titleElement.textContent.trim();
        
        // 초록 찾기
        const abstractElement = item.querySelector('.gs_rs');
        if (!abstractElement) {
            console.log('기사를 찾을 수 없음');
            return;
        }
        const abstract = abstractElement.textContent.trim();
        
        // 유사도 계산
        const similarity = await calculateSimilarity(title, abstract);
        if (similarity !== null) {
            // 제목에 유사도 표시
            titleElement.style.backgroundColor = getHighlightColor(similarity);
            titleElement.style.padding = '2px 4px';
            titleElement.style.borderRadius = '3px';
            
            // 마우스 이벤트 핸들러 추가
            titleElement.addEventListener('mouseenter', () => {
                showTooltip(tooltip, titleElement, similarity);
            });
            titleElement.addEventListener('mouseleave', () => {
                hideTooltip(tooltip);
            });
        }
    } catch (error) {
        console.error('기사 처리 실패:', error);
    }
};

// 검색 결과 처리
const processSearchResults = async (tooltip) => {
    const paperItems = document.querySelectorAll('.gs_ri');
    console.log('찾은 기사 수:', paperItems.length);
    
    for (const item of paperItems) {
        await processPaperItem(item, tooltip);
    }
};

// 기사 본문 페이지 처리 함수
const processArticlePage = async (tooltip) => {
    try {
        // 제목 찾기
        const titleSelectors = [
            'h2#title_area',
            '.news_title',
            '.article_title',
            '.tit_view',
            '.tit_news',
            '.tit_article'
        ];
        
        let titleElement = null;
        for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                titleElement = element;
                break;
            }
        }
        
        if (!titleElement) {
            console.log('제목을 찾을 수 없음');
            return;
        }
        
        const title = titleElement.textContent.trim();
        console.log('기사 제목:', title);
        
        // 본문 내용 가져오기
        const content = await getArticleContent();
        if (!content) {
            console.log('본문을 찾을 수 없음');
            return;
        }
        
        // 유사도 계산
        const similarity = await calculateSimilarity(title, content);
        if (similarity !== null) {
            console.log('유사도 계산 완료:', similarity);
            
            // 제목에 유사도 표시
            titleElement.style.backgroundColor = getHighlightColor(similarity);
            titleElement.style.padding = '2px 4px';
            titleElement.style.borderRadius = '3px';
            
            // 유사도 표시 동그라미 생성 및 추가
            const similarityCircle = createSimilarityCircle(similarity);
            titleElement.appendChild(similarityCircle);
            
            // 마우스 이벤트 핸들러 추가
            similarityCircle.addEventListener('mouseenter', () => {
                showTooltip(tooltip, similarityCircle, similarity);
            });
            similarityCircle.addEventListener('mouseleave', () => {
                hideTooltip(tooltip);
            });
        }
        
        // 추천 기사 컨테이너 찾기
        const recommendContainers = [
            // 다음 뉴스 추천 기사 컨테이너
            '.box_news_recommend',
            '.box_news_side',
            '.box_news_other',
            '.box_news_related',
            '.box_related',
            '.related_news',
            // 연예 뉴스 추천 기사 컨테이너
            '.box_entertain',
            '.box_entertain_recommend',
            '.box_entertain_side',
            '.box_entertain_other',
            '.box_entertain_related',
            // 기타 추천 기사 컨테이너
            '.box_recommend',
            '.box_side',
            '.box_other',
            '.box_related',
            '.box_news',
            '.box_thumb',
            '.box_headline'
        ];

        // 각 컨테이너 내의 기사 처리
        for (const containerSelector of recommendContainers) {
            const container = document.querySelector(containerSelector);
            if (!container) continue;

            console.log('추천 기사 컨테이너 찾음:', containerSelector);
            
            // 컨테이너 내의 모든 링크 찾기
            const links = container.querySelectorAll('a[href*="v.daum.net/v/"], a[href*="news.daum.net/article/"]');
            console.log(`${containerSelector} 내 기사 수:`, links.length);

            for (const link of links) {
                if (processedLinks.has(link.href)) continue;
                
                try {
                    const response = await fetch(link.href);
                    const html = await response.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    
                    const articleTitle = link.textContent.trim();
                    const articleContent = await getArticleContent(doc);
                    
                    if (articleTitle && articleContent) {
                        const similarity = await calculateSimilarity(articleTitle, articleContent);
                        if (similarity !== null) {
                            console.log('추천 기사 유사도 계산 완료:', similarity, articleTitle);
                            
                            // 링크에 유사도 표시
                            link.style.backgroundColor = getHighlightColor(similarity);
                            link.style.padding = '2px 4px';
                            link.style.borderRadius = '3px';
                            
                            // 유사도 표시 동그라미 생성 및 추가
                            const similarityCircle = createSimilarityCircle(similarity);
                            link.appendChild(similarityCircle);
                            
                            similarityCircle.addEventListener('mouseenter', () => {
                                showTooltip(tooltip, similarityCircle, similarity);
                            });
                            similarityCircle.addEventListener('mouseleave', () => {
                                hideTooltip(tooltip);
                            });
                            
                            processedLinks.add(link.href);
                        }
                    }
                } catch (error) {
                    console.error('추천 기사 처리 실패:', error);
                }
            }
        }
    } catch (error) {
        console.error('기사 페이지 처리 실패:', error);
    }
};
