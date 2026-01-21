/**
 * ScormClient.js
 * Handles communication with the LMS via SCORM 1.2 or SCORM 2004 (1.3) API.
 * Automatically detects the available API version.
 *
 * Migrated from UE5LMSBlueprint - shared SCORM infrastructure.
 */
export class ScormClient {
  constructor() {
    this.API = null;
    this.version = null; // "1.2" or "2004"
    this.isInitialized = false;
    this.debug = true;
  }

  /**
   * Initialize the SCORM connection
   * @returns {boolean} True if connection successful
   */
  initialize() {
    if (this.isInitialized) return true;

    // 1. Attempt to find SCORM 2004 API first
    this.API = this.findAPI("API_1484_11");
    if (this.API) {
      this.version = "2004";
    } else {
      // 2. Fallback to SCORM 1.2 API
      this.API = this.findAPI("API");
      if (this.API) {
        this.version = "1.2";
      }
    }

    if (!this.API) {
      this.log("SCORM API not found (checked 1.2 and 2004).");
      return false;
    }

    const result =
      this.version === "2004"
        ? this.API.Initialize("")
        : this.API.LMSInitialize("");

    if (result === "true") {
      this.isInitialized = true;
      this.log(`SCORM ${this.version} Initialized successfully.`);
      this.setIncomplete(); // Mark as incomplete on start
      return true;
    } else {
      this.handleError("Initialize");
      return false;
    }
  }

  /**
   * Find the SCORM API in window hierarchy
   */
  findAPI(apiName, win = window) {
    let attempts = 0;
    while (win[apiName] === null && win.parent !== null && win.parent !== win) {
      attempts++;
      if (attempts > 10) return null;
      win = win.parent;
    }
    return win[apiName];
  }

  /**
   * Set the score (0-100)
   * @param {number} score
   */
  setScore(score) {
    if (!this.isInitialized) return;

    if (this.version === "2004") {
      this.setValue("cmi.score.scaled", (score / 100).toFixed(2));
      this.setValue("cmi.score.raw", score);
      this.setValue("cmi.score.min", "0");
      this.setValue("cmi.score.max", "100");
    } else {
      // SCORM 1.2
      this.setValue("cmi.core.score.raw", score);
      this.setValue("cmi.core.score.min", "0");
      this.setValue("cmi.core.score.max", "100");
    }
    this.commit();
  }

  /**
   * Set completion status
   * @param {boolean} passed
   */
  setPassed(passed) {
    if (!this.isInitialized) return;

    if (this.version === "2004") {
      const status = passed ? "passed" : "failed";
      this.setValue("cmi.success_status", status);
      this.setValue("cmi.completion_status", "completed");
    } else {
      // SCORM 1.2: cmi.core.lesson_status can be passed, completed, failed, incomplete, browsed, not attempted
      const status = passed ? "passed" : "failed";
      this.setValue("cmi.core.lesson_status", status);
    }
    this.commit();
  }

  setIncomplete() {
    if (!this.isInitialized) return;

    if (this.version === "2004") {
      this.setValue("cmi.completion_status", "incomplete");
    } else {
      this.setValue("cmi.core.lesson_status", "incomplete");
    }
    this.commit();
  }

  /**
   * Helper to set value
   */
  setValue(parameter, value) {
    if (!this.isInitialized) return;

    let result = "false";
    if (this.version === "2004") {
      result = this.API.SetValue(parameter, value);
    } else {
      result = this.API.LMSSetValue(parameter, value);
    }

    if (result !== "true") {
      this.handleError(`SetValue(${parameter}, ${value})`);
    }
  }

  /**
   * Commit changes to LMS
   */
  commit() {
    if (!this.isInitialized) return;

    let result = "false";
    if (this.version === "2004") {
      result = this.API.Commit("");
    } else {
      result = this.API.LMSCommit("");
    }

    if (result !== "true") {
      this.handleError("Commit");
    }
  }

  /**
   * Terminate session
   */
  terminate() {
    if (!this.isInitialized) return;

    let result = "false";
    if (this.version === "2004") {
      result = this.API.Terminate("");
    } else {
      result = this.API.LMSFinish("");
    }

    if (result === "true") {
      this.isInitialized = false;
      this.log("SCORM Terminated.");
    } else {
      this.handleError("Terminate");
    }
  }

  handleError(action) {
    if (!this.API) return;

    let code, message, diagnostic;

    if (this.version === "2004") {
      code = this.API.GetLastError();
      message = this.API.GetErrorString(code);
      diagnostic = this.API.GetDiagnostic(code);
    } else {
      code = this.API.LMSGetLastError();
      message = this.API.LMSGetErrorString(code);
      diagnostic = this.API.LMSGetDiagnostic(code);
    }

    console.error(
      `SCORM ${this.version} Error [${action}]: ${code} - ${message} (${diagnostic})`
    );
  }

  log(msg) {
    if (this.debug) {
      console.log(`[ScormClient] ${msg}`);
    }
  }
}

// Export singleton
export const scormClient = new ScormClient();
