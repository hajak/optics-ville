const App = {
    currentLabIndex: 0,
    isDarkMode: false,

    labs: [
        { id: 'plane-mirror', name: 'Plan spegel', module: PlaneMirrorLab },
        { id: 'concave-mirror', name: 'Konkav spegel', module: ConcaveMirrorLab },
        { id: 'convex-mirror', name: 'Konvex spegel', module: ConvexMirrorLab },
        { id: 'convex-lens', name: 'Konvex lins', module: ConvexLensLab },
        { id: 'concave-lens', name: 'Konkav lins', module: ConcaveLensLab },
        { id: 'refraction', name: 'Brytning', module: RefractionLab },
        { id: 'prism', name: 'Prisma', module: PrismLab },
        { id: 'light-builder', name: 'Ljusbyggaren', module: LightBuilderLab }
    ],

    init() {
        this.loadTheme();
        this.setupWelcomeScreen();
        this.setupThemeToggle();
        this.setupResizeHandler();
        this.setupCompletionButtons();
        this.setupHelpModal();
        this.setupLabButtons();

        this.labs.forEach(lab => {
            lab.module.init();
        });
    },

    loadTheme() {
        const savedTheme = localStorage.getItem('optik-labbet-theme');
        if (savedTheme === 'dark') {
            this.isDarkMode = true;
            document.body.setAttribute('data-theme', 'dark');
            const toggle = document.getElementById('themeToggle');
            if (toggle) toggle.textContent = '\u2600\uFE0F';
        }
    },

    setupWelcomeScreen() {
        document.getElementById('startBtn').addEventListener('click', () => {
            document.getElementById('welcomeScreen').classList.add('hidden');
            document.getElementById('labInterface').classList.remove('hidden');
            this.startLab(0);
        });

        document.getElementById('startFreeformBtn').addEventListener('click', () => {
            document.getElementById('welcomeScreen').classList.add('hidden');
            document.getElementById('labInterface').classList.remove('hidden');
            this.startFreeformBuilder();
        });
    },

    startFreeformBuilder() {
        const builderIndex = this.labs.findIndex(lab => lab.id === 'light-builder');
        if (builderIndex === -1) return;

        this.currentLabIndex = builderIndex;

        document.querySelectorAll('.lab-section').forEach(section => {
            section.classList.remove('active');
        });

        document.getElementById('light-builder-lab').classList.add('active');

        const lab = this.labs[builderIndex];
        lab.module.resize();
        lab.module.setDarkMode(this.isDarkMode);

        document.getElementById('progressFill').style.width = '100%';
        document.getElementById('progressText').textContent = 'Fritt byggande';
    },

    setupHelpModal() {
        const modal = document.getElementById('helpModal');
        const closeBtn = document.getElementById('helpModalClose');
        const closeFooterBtn = document.getElementById('helpModalCloseBtn');

        const closeModal = () => {
            modal.classList.add('hidden');
        };

        closeBtn.addEventListener('click', closeModal);
        closeFooterBtn.addEventListener('click', closeModal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeModal();
            }
        });
    },

    setupLabButtons() {
        document.querySelectorAll('.help-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const labId = btn.dataset.lab;
                this.showHelpModal(labId);
            });
        });

        document.querySelectorAll('.next-lab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.goToNextLab();
            });
        });
    },

    showHelpModal(labId) {
        const lab = this.labs.find(l => l.id === labId);
        if (!lab) return;

        const steps = lab.module.guidedSteps || [];
        const modal = document.getElementById('helpModal');
        const title = document.getElementById('helpModalTitle');
        const content = document.getElementById('helpModalContent');

        title.textContent = `Hjälp: ${lab.name}`;

        if (steps.length === 0) {
            content.innerHTML = '<p class="builder-no-selection">Ingen hjälp tillgänglig för denna laboration.</p>';
        } else {
            content.innerHTML = steps.map((step, i) => `
                <div class="help-step">
                    <div class="help-step-header">
                        <span class="help-step-number">${i + 1}</span>
                        <span class="help-step-concept">${step.concept || 'Tips'}</span>
                    </div>
                    <p class="help-step-text">${step.text}</p>
                </div>
            `).join('');
        }

        modal.classList.remove('hidden');
    },

    setupThemeToggle() {
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.isDarkMode = !this.isDarkMode;

            if (this.isDarkMode) {
                document.body.setAttribute('data-theme', 'dark');
                document.getElementById('themeToggle').textContent = '\u2600\uFE0F';
                localStorage.setItem('optik-labbet-theme', 'dark');
            } else {
                document.body.removeAttribute('data-theme');
                document.getElementById('themeToggle').textContent = '\uD83C\uDF19';
                localStorage.setItem('optik-labbet-theme', 'light');
            }

            this.labs.forEach(lab => lab.module.setDarkMode(this.isDarkMode));
        });
    },

    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const currentLab = this.labs[this.currentLabIndex];
                if (currentLab && currentLab.module) {
                    currentLab.module.resize();
                }
            }, 100);
        });
    },

    setupCompletionButtons() {
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.currentLabIndex = 0;
            document.getElementById('completion-screen').classList.remove('active');
            this.startLab(0);
        });

        document.getElementById('freeExploreBtn').addEventListener('click', () => {
            this.enterFreeExploreMode();
        });

        document.getElementById('startQuizBtn').addEventListener('click', () => {
            document.getElementById('completion-screen').classList.remove('active');
            document.getElementById('quiz-screen').classList.add('active');
        });

        document.getElementById('backToCompletionBtn').addEventListener('click', () => {
            document.getElementById('quiz-screen').classList.remove('active');
            document.getElementById('completion-screen').classList.add('active');
        });

        document.getElementById('quizFreeExploreBtn').addEventListener('click', () => {
            document.getElementById('quiz-screen').classList.remove('active');
            this.enterFreeExploreMode();
        });
    },

    startLab(labIndex) {
        this.currentLabIndex = labIndex;

        document.querySelectorAll('.lab-section').forEach(section => {
            section.classList.remove('active');
        });

        const lab = this.labs[labIndex];
        document.getElementById(`${lab.id}-lab`).classList.add('active');

        lab.module.resize();
        lab.module.setDarkMode(this.isDarkMode);

        this.updateProgress();
    },

    updateProgress() {
        const totalLabs = this.labs.length;
        const progress = ((this.currentLabIndex + 1) / totalLabs) * 100;

        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('progressText').textContent = `Laboration ${this.currentLabIndex + 1}/${totalLabs}`;
    },

    goToNextLab() {
        if (this.currentLabIndex < this.labs.length - 1) {
            this.startLab(this.currentLabIndex + 1);
        } else {
            this.showCompletionScreen();
        }
    },

    showCompletionScreen() {
        document.querySelectorAll('.lab-section').forEach(section => {
            section.classList.remove('active');
        });

        document.getElementById('completion-screen').classList.add('active');

        document.getElementById('progressFill').style.width = '100%';
        document.getElementById('progressText').textContent = 'Klart!';
    },

    enterFreeExploreMode() {
        document.getElementById('completion-screen').classList.remove('active');

        this.currentLabIndex = 0;
        const lab = this.labs[0];
        document.getElementById(`${lab.id}-lab`).classList.add('active');

        lab.module.resize();
        lab.module.setDarkMode(this.isDarkMode);

        document.getElementById('progressText').textContent = 'Fritt läge';
    },

    switchToLab(labIndex) {
        document.querySelectorAll('.lab-section').forEach(section => {
            section.classList.remove('active');
        });

        const lab = this.labs[labIndex];
        document.getElementById(`${lab.id}-lab`).classList.add('active');

        this.currentLabIndex = labIndex;
        lab.module.resize();
        lab.module.setDarkMode(this.isDarkMode);

        document.getElementById('progressText').textContent = `${lab.name}`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
