const AppOnboarding = {
  STEPS: [
    {
      title: "Добро пожаловать в Transport Company!",
      text: "Вы начинаете свой бизнес с капиталом €100 000 и одним нанятым водителем в штате. Первым делом нужно обзавестись первым тягачом в автопарке.",
      actionLabel: "Выбрать тягач на рынке",
      onAction() { AppUI.switchTab("market_hub"); }
    },
    {
      title: "Покупка техники (Новый или Б/У)",
      text: "В автосалоне продаются новые тягачи с гарантией, а на вторичном рынке — дешевые варианты с пробегом и износом. Купите подходящий тягач.",
      actionLabel: "Перейти в гараж",
      onAction() { AppUI.switchTab("garage_hub"); }
    },
    {
      title: "Закрепление водителя за машиной",
      text: "Нажмите на купленный тягач в гараже и назначьте на него водителя из штата компании. Без назначенного шофера рейс отправить нельзя.",
      actionLabel: "Открыть биржу заказов",
      onAction() { AppUI.switchTab("orders"); }
    },
    {
      title: "Первый коммерческий рейс",
      text: "Оцените маршрут, массу груза и прогнозируемую прибыль лота. Выберите рейс и нажмите «Отправить» для выезда на автобан.",
      actionLabel: "Поехали!",
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
        <span class="onboarding-step-badge">Старт: Шаг ${index + 1} из ${this.STEPS.length}</span>
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