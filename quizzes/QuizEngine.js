/**
 * QuizEngine.js
 *
 * SCORM 1.2 compatible quiz engine for LMS integration.
 * Handles question loading, answer tracking, and score reporting.
 */

export class QuizEngine {
  constructor(options = {}) {
    this.questions = [];
    this.currentIndex = 0;
    this.answers = new Map();
    this.score = 0;
    this.maxScore = 0;
    this.startTime = null;
    this.endTime = null;

    // SCORM API reference (if available)
    this.scormApi = this.findScormApi();

    // Options
    this.shuffleQuestions = options.shuffle || false;
    this.showFeedback = options.showFeedback !== false;
    this.passingScore = options.passingScore || 70;
  }

  /**
   * Find SCORM API in window hierarchy
   */
  findScormApi() {
    let win = window;
    let attempts = 0;

    while (win && attempts < 10) {
      if (win.API) return win.API;
      if (win.API_1484_11) return win.API_1484_11;
      win = win.parent === win ? null : win.parent;
      attempts++;
    }

    console.warn("SCORM API not found - running in standalone mode");
    return null;
  }

  /**
   * Initialize SCORM session
   */
  initScorm() {
    if (!this.scormApi) return false;

    try {
      const result = this.scormApi.LMSInitialize("");
      if (result === "true") {
        this.scormApi.LMSSetValue("cmi.core.lesson_status", "incomplete");
        return true;
      }
    } catch (e) {
      console.error("SCORM init failed:", e);
    }
    return false;
  }

  /**
   * Load questions for a specific category
   */
  loadQuestions(questions) {
    this.questions = questions.map((q, i) => ({
      ...q,
      id: q.id || `q_${i}`,
      answered: false,
    }));

    if (this.shuffleQuestions) {
      this.questions = this.shuffleArray([...this.questions]);
    }

    this.maxScore = this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    this.startTime = new Date();
    this.currentIndex = 0;

    return this.questions.length;
  }

  /**
   * Get current question
   */
  getCurrentQuestion() {
    return this.questions[this.currentIndex] || null;
  }

  /**
   * Get question by index
   */
  getQuestion(index) {
    return this.questions[index] || null;
  }

  /**
   * Submit answer for current question
   */
  submitAnswer(answerId) {
    const question = this.getCurrentQuestion();
    if (!question) return null;

    question.answered = true;
    this.answers.set(question.id, answerId);

    const isCorrect = question.correctAnswer === answerId;
    if (isCorrect) {
      this.score += question.points || 1;
    }

    return {
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || null,
      score: this.score,
      maxScore: this.maxScore,
    };
  }

  /**
   * Navigate to next question
   */
  nextQuestion() {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      return this.getCurrentQuestion();
    }
    return null;
  }

  /**
   * Navigate to previous question
   */
  previousQuestion() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.getCurrentQuestion();
    }
    return null;
  }

  /**
   * Calculate final score and percentage
   */
  calculateResults() {
    this.endTime = new Date();
    const duration = Math.round((this.endTime - this.startTime) / 1000);
    const percentage = Math.round((this.score / this.maxScore) * 100);
    const passed = percentage >= this.passingScore;

    return {
      score: this.score,
      maxScore: this.maxScore,
      percentage,
      passed,
      duration,
      totalQuestions: this.questions.length,
      answeredQuestions: this.answers.size,
    };
  }

  /**
   * Report score to SCORM LMS
   */
  reportToScorm() {
    if (!this.scormApi) return false;

    const results = this.calculateResults();

    try {
      // Set score
      this.scormApi.LMSSetValue("cmi.core.score.raw", results.score.toString());
      this.scormApi.LMSSetValue("cmi.core.score.min", "0");
      this.scormApi.LMSSetValue(
        "cmi.core.score.max",
        results.maxScore.toString()
      );

      // Set lesson status
      const status = results.passed ? "passed" : "failed";
      this.scormApi.LMSSetValue("cmi.core.lesson_status", status);

      // Set session time (format: HHHH:MM:SS.SS)
      const hours = Math.floor(results.duration / 3600);
      const minutes = Math.floor((results.duration % 3600) / 60);
      const seconds = results.duration % 60;
      const timeString = `${hours.toString().padStart(4, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.00`;
      this.scormApi.LMSSetValue("cmi.core.session_time", timeString);

      // Commit
      this.scormApi.LMSCommit("");

      return true;
    } catch (e) {
      console.error("SCORM report failed:", e);
      return false;
    }
  }

  /**
   * End SCORM session
   */
  finishScorm() {
    if (!this.scormApi) return false;

    try {
      this.reportToScorm();
      this.scormApi.LMSFinish("");
      return true;
    } catch (e) {
      console.error("SCORM finish failed:", e);
      return false;
    }
  }

  /**
   * Shuffle array (Fisher-Yates)
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Get progress percentage
   */
  getProgress() {
    return Math.round((this.answers.size / this.questions.length) * 100);
  }
}

export default QuizEngine;
