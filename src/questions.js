// Form IDs
const FORMS = {
  USERS: '1lwKxX193Z5H6j_h_lSH3bdS-pFd6rOvGt6doeBDvUZ8',
  RESULTS: '1L_C-gYJAcokzKyAr8Lw3uiN68H-O5Q6vEWPuz32hasY',
  WRONG_ANSWERS: '1BaLnw3DR4BP-j8t4FN1bfnqihj_h7MATdOnUCcXGCDw'
};

// Form submission URLs
const FORM_URLS = {
  USERS: `https://docs.google.com/forms/d/${FORMS.USERS}/formResponse`,
  RESULTS: `https://docs.google.com/forms/d/${FORMS.RESULTS}/formResponse`,
  WRONG_ANSWERS: `https://docs.google.com/forms/d/${FORMS.WRONG_ANSWERS}/formResponse`
};

// quizQuestions 기본 데이터 추가
export const quizQuestions = [
  {
    step: 1,
    question: '다음 단어의 반대말은?',
    word: '자유',
    options: [
      { id: 1, text: '독립' },
      { id: 2, text: '억압' },
      { id: 3, text: '전통' }
    ],
    answer: '억압',
    hint: '강압과 비슷한 의미입니다',
    category: '국어',
    level: '초급'
  }
];

// UserID 생성 함수
export const generateUserId = () => {
  return `USER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const registerUser = async (name) => {
  const now = new Date().toISOString();
  const userId = generateUserId();

  const user = {
    userId,
    name,
    createdAt: now,
    lastAccessAt: now,
    totalStudyTime: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    accuracy: 0
  };

  try {
    // localStorage에만 저장하고 폼 전송은 하지 않음
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  } catch (error) {
    console.error('Error registering user:', error);
    return null;
  }
};

// 퀴즈 결과 저장
export const saveQuizResult = async (quizData) => {
  if (!quizData || !quizData.score) {
    console.error('Invalid quiz data');
    return false;
  }

  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) return false;

  const now = new Date().toISOString();
  
  try {
    // 1. 오답 정보 저장
    if (quizData.wrongAnswers?.length > 0) {
      const wrongAnswersPromises = quizData.wrongAnswers.map(wrong => {
        const wrongFormData = new FormData();
        wrongFormData.append('entry.1754930772', user.name);
        wrongFormData.append('entry.17007531', now);
        wrongFormData.append('entry.912276066', wrong.question);
        wrongFormData.append('entry.572880675', wrong.correctAnswer);
        wrongFormData.append('entry.1506016494', wrong.yourAnswer);
        wrongFormData.append('entry.254040016', `${quizData.selectedWeek}/${quizData.selectedDay}`);
        wrongFormData.append('entry.903891306', quizData.level);
        wrongFormData.append('entry.1657044084', String(wrong.questionNumber));

        return fetch(FORM_URLS.WRONG_ANSWERS, {
          method: 'POST',
          mode: 'no-cors',
          body: new URLSearchParams(wrongFormData)
        });
      });

      await Promise.all(wrongAnswersPromises);
    }

    // 2. QuizResults 데이터 저장
    const quizFormData = new FormData();
    quizFormData.append('entry.457728055', user.name);
    quizFormData.append('entry.1391954200', now);
    quizFormData.append('entry.84194388', quizData.level);
    quizFormData.append('entry.1610792376', `${quizData.selectedWeek}/${quizData.selectedDay}`);
    quizFormData.append('entry.1106397759', '5');
    quizFormData.append('entry.1316086715', String(quizData.score));
    quizFormData.append('entry.1861667944', String(quizData.timeSpent));
    
    const hintUsage = quizData.hintsUsed?.length > 0 
      ? quizData.hintsUsed.map(h => h.questionNumber).join(',')
      : '없음';
    quizFormData.append('entry.1469800692', hintUsage);

    // QuizResults 저장
    await fetch(FORM_URLS.RESULTS, {
      method: 'POST',
      mode: 'no-cors',
      body: new URLSearchParams(quizFormData)
    });

    // 3. Users 데이터 업데이트
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return false;

    const studyTime = parseInt(String(quizData.timeSpent)) || 0;
    const totalStudyTime = (parseInt(String(currentUser.totalStudyTime)) || 0) + studyTime;
    const totalQuestions = (parseInt(String(currentUser.totalQuestions)) || 0) + 5;
    const totalCorrect = (parseInt(String(currentUser.totalCorrect)) || 0) + quizData.score;
    const accuracy = Math.round((totalCorrect / totalQuestions) * 100);

    // localStorage 업데이트
    const updatedUser = {
      ...currentUser,
      totalStudyTime,
      totalQuestions,
      totalCorrect,
      accuracy,
      lastAccessAt: now
    };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    // Users 시트에 최종 업데이트
    const userFormData = new FormData();
    userFormData.append('entry.2131886430', updatedUser.userId);
    userFormData.append('entry.2099612741', updatedUser.name);
    userFormData.append('entry.1112895249', updatedUser.createdAt);
    userFormData.append('entry.1125686986', now);
    userFormData.append('entry.732458785', String(totalStudyTime));
    userFormData.append('entry.1314368282', String(totalQuestions));
    userFormData.append('entry.776600633', String(totalCorrect));
    userFormData.append('entry.1637599612', String(accuracy));

    await fetch(FORM_URLS.USERS, {
      method: 'POST',
      mode: 'no-cors',
      body: new URLSearchParams(userFormData)
    });

    return true;
  } catch (error) {
    console.error('Error saving quiz result:', error);
    return false;
  }
};

export const fetchQuestions = async (level, week, day) => {
  const SHEET_ID = '1JYIJGzOYEgrvxQex5iJAu-MNeMKo2BCQ';
  const gids = {
    '가볍게': '1955098583',
    '알차게': '520225063',
    '완벽하게': '276816936'
  };

  const weekNum = week.replace('주차', '');
  const dayNum = day.replace('일차', '');

  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gids[level]}`;

  try {
    console.log(`📢 Fetching data from: ${SHEET_URL}`);  // URL 확인

    const response = await fetch(SHEET_URL);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

    const text = await response.text();
    console.log('📢 Raw data received:', text.substring(0, 300)); // 일부 데이터 확인

    const rows = text
      .split('\n')
      .slice(1) // 헤더 제외
      .map(row => row.split(',').map(cell => cell.trim()));

    console.log('📢 Parsed rows:', rows.length, 'rows loaded');

    // 주차와 일차로 필터링
    const filtered = rows.filter(row => {
      const weekValue = row[1].replace(/[^0-9]/g, '');  // "1주차" → "1" 변환
      const dayValue = row[2].replace(/[^0-9]/g, '');    // "1일차" → "1" 변환

      console.log(`🔍 Checking row (Filtered): Week=${weekValue}, Day=${dayValue} (Expected: Week=${weekNum}, Day=${dayNum})`);

      return weekValue === weekNum && dayValue === dayNum;
    });

    console.log(`📢 Filtered Questions (Week: ${weekNum}, Day: ${dayNum}):`, filtered.length);

    return filtered.map((row, index) => ({
      step: index + 1,
      question: row[4] || '다음 단어의 뜻으로 가장 적절한 것은?',
      word: row[5],
      category: row[3],
      options: shuffleArray([
        { id: 1, text: row[6] },
        { id: 2, text: row[7] },
        { id: 3, text: row[8] },
        { id: 4, text: row[9] }
      ]),
      answer: row[10],
      hint: row[11],
      level,
      week,
      day
    }));
  } catch (error) {
    console.error('🚨 Error fetching questions:', error);
    return [];
  }
};

// 공통으로 사용할 배열 셔플 함수
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// localStorage 접근 전 사용 가능 여부 체크 함수
const isLocalStorageAvailable = () => {
  try {
    const test = 'test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

// localStorage에서 현재 사용자 정보 가져오기
export const getCurrentUser = () => {
  if (!isLocalStorageAvailable()) return null;

  try {
    return JSON.parse(localStorage.getItem('currentUser'));
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const saveStats = async (stats) => {
  if (!isLocalStorageAvailable()) {
    console.error('localStorage is not available');
    return false;
  }

  try {
    const existingStats = JSON.parse(localStorage.getItem('quizStats') || '[]');
    if (!Array.isArray(existingStats)) {
      throw new Error('Invalid stats data');
    }

    const newStats = {
      ...stats,
      timestamp: new Date().toISOString()
    };

    existingStats.push(newStats);
    localStorage.setItem('quizStats', JSON.stringify(existingStats));
    return true;
  } catch (error) {
    console.error('Error saving stats:', error);
    return false;
  }
};

export const getStats = () => {
  if (!isLocalStorageAvailable()) {
    console.error('localStorage is not available');
    return [];
  }

  try {
    const stats = JSON.parse(localStorage.getItem('quizStats') || '[]');
    return Array.isArray(stats) ? stats : [];
  } catch (error) {
    console.error('Error loading stats:', error);
    return [];
  }
};