const AppOnboarding = {
  STEPS: [
    {
      title: "Добро пожаловать в Transport Company!",
      text: "Вы начинаете как частный перевозчик с капиталом €100 000, одним тягачом MAN TGX и закрепленным водителем. Давайте подготовим первый рейс.",
      actionLabel: "Осмотреть автопарк",
      onAction() { AppUI.switchTab("fleet"); }
    },
    {
      title: "Автопарк и 7 критических узлов",
      text: "Каждый грузовик изнашивается в пути: двигатель, тормоза, шины и охлаждение. Следите за износом узлов и стоимостью владения (TCO).",
      actionLabel: "Проверить биржу заказов",
      onAction() { AppUI.switchTab("orders"); }
    },
    {
      title: "Выбор первого логистического лота",
      text: "Перед взятием заказа изучите блок маржинальности: дизель, зарплата и дорожные сборы вычитаются из выручки. Выберите заказ и нажмите «Отправить».",
      actionLabel: "Понятно",
      onAction() { AppOnboarding.nextStep(); }
    },
    {
      title: "Мониторинг рейса на трассе",
      text: "Рейс движется в реальном времени! Следите за остатком бака, усталостью шофера и возможными заторами во вкладке «Рейсы в пути».",
      actionLabel: "Завершить обучение",
      onAction() { AppOnboarding.completeTutorial(); }
    }
  ],

  init() {
    const s = AppState.get();
    if (!s.tutorial || s.tutorial.completed) return;
    this.renderStep(s.tutorial.currentStepIndex || 0);
  },

  renderStep(index) {
    const existing = document.getElementById("onboarding-floater-box");
    if (existing) existing.remove();

    if (index >= this.STEPS.length) {
      this.completeTutorial();
      return;
    }

    const step = this.STEPS[index];
    const floater = document.createElement("div");
    floater.id = "onboarding-floater-box";
    floater.className = "onboarding-floater";

    floater.innerHTML = `
      <div class="onboarding-top">
        <span class="onboarding-step-badge">Обучение: Шаг ${index + 1} из ${this.STEPS.length}</span>
        <span class="onboarding-close" onclick="AppOnboarding.completeTutorial()">&times;</span>
      </div>
      <div class="onboarding-title">${step.title}</div>
      <p class="onboarding-text">${step.text}</p>
      <div class="onboarding-actions">
        <button class="btn-glass small primary" onclick="AppOnboarding.executeStepAction(${index})">
          ${step.actionLabel}
        </button>
      </div>
    `;

    document.body.appendChild(floater);
  },

  executeStepAction(index) {
    const step = this.STEPS[index];
    if (step && typeof step.onAction === "function") {
      step.onAction();
    }
    this.nextStep();
  },

  nextStep() {
    const s = AppState.get();
    s.tutorial.currentStepIndex = (s.tutorial.currentStepIndex || 0) + 1;
    AppStorage.save(s);

    if (s.tutorial.currentStepIndex >= this.STEPS.length) {
      this.completeTutorial();
    } else {
      this.renderStep(s.tutorial.currentStepIndex);
    }
  },

  completeTutorial() {
    const s = AppState.get();
    s.tutorial.completed = true;
    AppStorage.save(s);

    const existing = document.getElementById("onboarding-floater-box");
    if (existing) existing.remove();
  }
};
