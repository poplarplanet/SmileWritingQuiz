import React, { useState, useEffect } from 'react';
import {
  fetchQuestions,
  saveQuizResult,
  getCurrentUser,
  registerUser
} from './questions';

// 상수 정의
const TIMER_SECONDS = 30;
const QUIZ_LEVELS = ['가볍게', '알차게', '완벽하게'];
const WEEKS = Array.from({ length: 8 }, (_, i) => `${i + 1}주차`);
const DAYS = Array.from({ length: 7 }, (_, i) => `${i + 1}일차`);

// 사용자 이름 입력 컴포넌트
const RegistrationForm = ({ onSubmit }) => {
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name.trim()) {
      const user = await registerUser(name.trim());
      if (user) {
        onSubmit();
      } else {
        alert('사용자 등록에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  return (
    <div className="container">
      <div className="quiz-box">
        <h1>한국어 단어 퀴즈</h1>
        <form onSubmit={handleSubmit}>
          <div className="name-input-container">
            <label htmlFor="name">이름을 입력해주세요</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              className="name-input"
              required
            />
          </div>
          <button type="submit" className="start-button">시작하기</button>
        </form>
      </div>
    </div>
  );
};

// 퀴즈 설정 화면 컴포넌트
const QuizSetup = ({ onStart }) => {
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedDay, setSelectedDay] = useState('');

  const isValid = selectedLevel && selectedWeek && selectedDay;

  return (
    <div className="container">
      <div className="quiz-box">
        <h1>단어 퀴즈</h1>
        <div className="settings">
          <SettingGroup
            title="난이도 선택"
            options={QUIZ_LEVELS}
            selected={selectedLevel}
            onSelect={setSelectedLevel}
          />
          <SettingGroup
            title="주차 선택"
            options={WEEKS}
            selected={selectedWeek}
            onSelect={setSelectedWeek}
          />
          <SettingGroup
            title="일차 선택"
            options={DAYS}
            selected={selectedDay}
            onSelect={setSelectedDay}
          />
        </div>
        <button
          onClick={() => isValid && onStart(selectedLevel, selectedWeek, selectedDay)}
          className={`start-button ${!isValid ? 'disabled' : ''}`}
        >
          퀴즈 시작하기
        </button>
      </div>
    </div>
  );
};

// 설정 그룹 컴포넌트
const SettingGroup = ({ title, options, selected, onSelect }) => (
  <div className="setting-group">
    <h3>{title}</h3>
    <div className="options">
      {options.map(option => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className={selected === option ? 'selected' : ''}
        >
          {option}
        </button>
      ))}
    </div>
  </div>
);

// 퀴즈 문제 화면 컴포넌트
const QuizQuestion = ({ question, onAnswer, selectedAnswer, onHintUse }) => {
  console.log('Current question:', question);  // 디버깅용

  return (
    <div className="container">
      <div className="quiz-box">
        <div className="quiz-header">
          <h2>문제 {question.index + 1}/5</h2>
          <div className="category-badge">{question.category}</div>
        </div>
        <h3>{question.question}</h3>
        <div className="word-box">{question.word}</div>
        <HintSection
          hint={question.hint}
          questionIndex={question.index}
          onHintUse={onHintUse}
        />
        <div className="options">
          {question.options.map(option => (
            <button
              key={option.id}
              onClick={() => onAnswer(option.text)}
              className={selectedAnswer === option.text ? 'selected' : ''}
            >
              {option.text}
            </button>
          ))}
        </div>
        <button
          className="submit-button"
          disabled={!selectedAnswer}
          onClick={() => onAnswer(selectedAnswer, true)}
        >
          {question.isLast ? '제출하기' : '다음 문제'}
        </button>
      </div>
    </div>
  );
};

// 힌트 섹션 컴포넌트
const HintSection = ({ hint, questionIndex, onHintUse }) => {
  const [isVisible, setIsVisible] = useState(false);

  // 문제 번호가 바뀔 때마다 힌트 숨기기
  useEffect(() => {
    setIsVisible(false);
  }, [questionIndex]);

  const handleHintClick = () => {
    if (!isVisible) {
      onHintUse(questionIndex + 1);  // 문제 번호는 1부터 시작
    }
    setIsVisible(!isVisible);
  };

  return (
    <div className="hint-section">
      <button
        onClick={handleHintClick}
        className="hint-button"
      >
        힌트 {isVisible ? '숨기기' : '보기'}
      </button>
      {isVisible && <div className="hint-text">{hint}</div>}
    </div>
  );
};

// 결과 화면 컴포넌트
const QuizResult = ({ score, totalQuestions, wrongAnswers, stats, onRestart }) => (
  <div className="container">
    <div className="quiz-box">
      <h2>퀴즈 결과</h2>
      <div className="result-score">
        총점: {score}/{totalQuestions}
        ({Math.round((score / totalQuestions) * 100)}%)
      </div>
      <div className="stats">
        <h3>통계</h3>
        <p>난이도: {stats.level}</p>
        <p>소요 시간: {stats.timeSpent}초</p>
        <p>힌트 사용: 총 {stats.hintsUsed.length}회</p>
        {stats.hintsUsed.length > 0 && (
          <div className="hint-usage-details">
            <p>힌트 사용 내역:</p>
            <ul>
              {stats.hintsUsed.map((hint, index) => (
                <li key={index}>
                  {hint.questionNumber}번 문제
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {wrongAnswers.length > 0 && (
        <div className="wrong-answers">
          <h3>오답 노트</h3>
          {wrongAnswers.map((wrong, index) => (
            <div key={index} className="wrong-answer-item">
              <p><strong>문제 {wrong.questionNumber}:</strong> {wrong.question}</p>
              <p><strong>카테고리:</strong> {wrong.category}</p>
              <p><strong>단어:</strong> {wrong.word}</p>
              <p><strong>제출한 답:</strong> {wrong.yourAnswer}</p>
              <p><strong>정답:</strong> {wrong.correctAnswer}</p>
            </div>
          ))}
        </div>
      )}
      <button onClick={onRestart} className="restart-button">
        다시 시작하기
      </button>
    </div>
  </div>
);

// 메인 앱 컴포넌트
const App = () => {
  // 상태 관리
  const [user, setUser] = useState(null);
  const [gameState, setGameState] = useState('start');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [quizStats, setQuizStats] = useState({
    level: '',
    startTime: null,
    timeSpent: 0,
    hintsUsed: [],  // { questionNumber: number, timestamp: Date }[]
  });

  // 퀴즈 초기화 함수
  const initializeQuiz = async (level, week, day) => {
    try {
      const fetchedQuestions = await fetchQuestions(level, week, day);
      
      if (!fetchedQuestions?.length) {
        alert("문제를 불러오는데 실패했습니다. 다시 시도해주세요.");
        return;
      }
  
      setQuestions(fetchedQuestions);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setScore(0);
      setWrongAnswers([]);
      setQuizStats({
        level,
        selectedWeek: week,    // 추가: 선택한 주차 저장
        selectedDay: day,      // 추가: 선택한 일차 저장
        startTime: new Date(),
        hintsUsed: []
      });
    } catch (error) {
      console.error('Quiz initialization error:', error);
    }
  };

  // 힌트 사용 처리 함수
  const handleHintUse = (questionNumber) => {
    console.log('Hint used for question:', questionNumber);  // 디버깅용
    setQuizStats(prev => {
      // 이미 해당 문제에 대한 힌트를 사용했는지 확인
      const alreadyUsed = prev.hintsUsed.some(h => h.questionNumber === questionNumber);
      if (!alreadyUsed) {
        return {
          ...prev,
          hintsUsed: [...prev.hintsUsed, {
            questionNumber,
            timestamp: new Date()
          }]
        };
      }
      return prev;
    });
  };

  // 답변 처리 함수
  const handleAnswer = (answer, isSubmit = false) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);

    if (isSubmit) {
      if (currentQuestionIndex === questions.length - 1) {
        const results = calculateResults(newAnswers, questions);
        const endTime = new Date();
        const timeSpent = Math.floor((endTime - quizStats.startTime) / 1000);
        
        setScore(results.score);
        setWrongAnswers(results.wrongAnswers);
        setGameState('result');
        
        const finalStats = {
          ...quizStats,
          timeSpent,
          score: results.score,
          totalQuestions: questions.length,
          wrongAnswers: results.wrongAnswers,
          selectedWeek: quizStats.selectedWeek,   // 추가: 선택한 주차 전달
          selectedDay: quizStats.selectedDay      // 추가: 선택한 일차 전달
        };
        setQuizStats(finalStats);
        saveQuizResult(finalStats);
      } else {
        // 다음 문제로 이동
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }
  };

  // 결과 계산 함수
  const calculateResults = (submittedAnswers, quizQuestions) => {
    let score = 0;
    const wrongAnswers = [];

    submittedAnswers.forEach((answer, index) => {
      const question = quizQuestions[index];
      if (answer === question.answer) {
        score++;
      } else {
        wrongAnswers.push({
          questionNumber: index + 1,
          question: question.question,
          word: question.word,
          category: question.category,  // 스프레드시트의 D열 값
          yourAnswer: answer,
          correctAnswer: question.answer
        });
      }
    });

    return { score, wrongAnswers };
  };

  // 조건부 렌더링
  if (!user) {
    return <RegistrationForm onSubmit={() => setUser(getCurrentUser())} />;
  }

  if (gameState === 'start') {
    return <QuizSetup onStart={(level, week, day) => {
      setGameState('playing');
      initializeQuiz(level, week, day);
    }} />;
  }

  if (gameState === 'result') {
    return (
      <QuizResult
        score={score}
        totalQuestions={questions.length}
        wrongAnswers={wrongAnswers}
        stats={quizStats}
        onRestart={() => setGameState('start')}
      />
    );
  }

  if (!questions[currentQuestionIndex]) {
    return <div>문제를 불러오는 중...</div>;
  }

  return (
    <QuizQuestion
      question={{
        ...questions[currentQuestionIndex],
        index: currentQuestionIndex,
        isLast: currentQuestionIndex === questions.length - 1
      }}
      onAnswer={handleAnswer}
      onHintUse={handleHintUse}
      selectedAnswer={answers[currentQuestionIndex]}
    />
  );
};

export default App;