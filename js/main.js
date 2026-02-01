const App = {
    currentLabIndex: 0,
    isDarkMode: false,
    currentLang: 'sv',

    labs: [
        { id: 'plane-mirror', module: PlaneMirrorLab },
        { id: 'concave-mirror', module: ConcaveMirrorLab },
        { id: 'convex-mirror', module: ConvexMirrorLab },
        { id: 'convex-lens', module: ConvexLensLab },
        { id: 'concave-lens', module: ConcaveLensLab },
        { id: 'refraction', module: RefractionLab },
        { id: 'prism', module: PrismLab },
        { id: 'light-builder', module: LightBuilderLab }
    ],

    t(key) {
        return Translations[this.currentLang][key] || key;
    },

    getLabName(index) {
        return Translations[this.currentLang].labNames[index];
    },

    getLabTitle(index) {
        return Translations[this.currentLang].labTitles[index];
    },

    init() {
        this.loadTheme();
        this.loadLang();
        this.setupWelcomeScreen();
        this.setupThemeToggle();
        this.setupLangToggle();
        this.setupResizeHandler();
        this.setupCompletionButtons();
        this.setupHelpModal();
        this.setupLabButtons();

        this.labs.forEach(lab => {
            lab.module.init();
        });

        this.applyTranslations();
    },

    loadLang() {
        const savedLang = localStorage.getItem('optik-labbet-lang');
        if (savedLang && (savedLang === 'en' || savedLang === 'sv')) {
            this.currentLang = savedLang;
            document.getElementById('langToggle').textContent = savedLang === 'sv' ? 'EN' : 'SV';
        }
    },

    setupLangToggle() {
        document.getElementById('langToggle').addEventListener('click', () => {
            this.currentLang = this.currentLang === 'sv' ? 'en' : 'sv';
            document.getElementById('langToggle').textContent = this.currentLang === 'sv' ? 'EN' : 'SV';
            localStorage.setItem('optik-labbet-lang', this.currentLang);
            this.applyTranslations();
        });
    },

    applyTranslations() {
        const t = (key) => this.t(key);

        // Welcome screen
        document.querySelector('.welcome-content h1').textContent = t('welcomeTitle');
        document.querySelector('.welcome-intro').textContent = t('welcomeIntro');
        document.querySelector('.learning-objectives h3').textContent = t('learningTitle');
        const learningItems = document.querySelectorAll('.learning-objectives li');
        if (learningItems.length >= 5) {
            learningItems[0].textContent = t('learning1');
            learningItems[1].textContent = t('learning2');
            learningItems[2].textContent = t('learning3');
            learningItems[3].textContent = t('learning4');
            learningItems[4].textContent = t('learning5');
        }
        document.querySelector('.lab-overview h3').textContent = t('labOverviewTitle');
        document.getElementById('startBtn').textContent = t('startBtn');
        document.getElementById('startFreeformBtn').textContent = t('startFreeformBtn');

        // Lab cards
        const labCards = document.querySelectorAll('.lab-card .lab-title');
        labCards.forEach((card, i) => {
            if (i < this.labs.length) {
                card.textContent = this.getLabName(i);
            }
        });

        // Logo
        document.querySelector('.logo').textContent = t('logo');

        // Lab headers and buttons
        this.labs.forEach((lab, i) => {
            const section = document.getElementById(`${lab.id}-lab`);
            if (section) {
                const header = section.querySelector('.lab-header h2');
                if (header) header.textContent = this.getLabTitle(i);

                const nextBtn = section.querySelector('.next-lab-btn');
                if (nextBtn) {
                    if (i === this.labs.length - 1) {
                        nextBtn.innerHTML = t('finish') + ' &#x2192;';
                    } else {
                        nextBtn.innerHTML = t('nextLab') + ' &#x2192;';
                    }
                }

                const helpBtn = section.querySelector('.help-btn');
                if (helpBtn) helpBtn.title = t('showHelp');
            }
        });

        // Info panel labels
        document.querySelectorAll('.info-panel h3').forEach(h3 => {
            const text = h3.textContent;
            if (text.includes('Bildens') || text.includes('Image')) {
                h3.textContent = t('imageProperties');
            } else if (text.includes('Brytnings') || text.includes('Refraction')) {
                h3.textContent = t('refractionData');
            } else if (text.includes('Ljusets') || text.includes('Light')) {
                h3.textContent = t('lightProperties');
            }
        });

        // Control labels
        this.updateControlLabels();

        // Completion screen
        const completionH2 = document.querySelector('#completion-screen h2');
        if (completionH2) completionH2.textContent = t('congratulations');
        const completionP = document.querySelector('#completion-screen .completion-content > p');
        if (completionP) completionP.textContent = t('youLearned');
        const completionItems = document.querySelectorAll('#completion-screen .completion-list li');
        if (completionItems.length >= 5) {
            completionItems[0].textContent = t('completed1');
            completionItems[1].textContent = t('completed2');
            completionItems[2].textContent = t('completed3');
            completionItems[3].textContent = t('completed4');
            completionItems[4].textContent = t('completed5');
        }
        document.getElementById('startQuizBtn').textContent = t('testKnowledge');
        document.getElementById('restartBtn').textContent = t('restart');
        document.getElementById('freeExploreBtn').textContent = t('freeExplore');

        // Quiz screen
        const quizH2 = document.querySelector('#quiz-screen h2');
        if (quizH2) quizH2.textContent = t('quizTitle');
        const quizIntro = document.querySelector('.quiz-intro');
        if (quizIntro) quizIntro.textContent = t('quizIntro');
        document.getElementById('backToCompletionBtn').textContent = t('back');
        document.getElementById('quizFreeExploreBtn').textContent = t('exploreAgain');

        // Help modal
        document.getElementById('helpModalCloseBtn').textContent = t('close');

        // Light builder
        this.updateBuilderLabels();

        // Update progress text
        this.updateProgress();
    },

    updateControlLabels() {
        const t = (key) => this.t(key);

        // Focal length labels
        document.querySelectorAll('.control-group label').forEach(label => {
            const text = label.textContent;
            if (text.includes('Brännvidd') || text.includes('Focal')) {
                const valueSpan = label.querySelector('span');
                const value = valueSpan ? valueSpan.textContent : '';
                label.innerHTML = `${t('focalLength')} <span id="${valueSpan?.id || ''}">${value}</span>px`;
            } else if (text.includes('Material')) {
                label.textContent = t('material');
            } else if (text.includes('Infallsvinkel') || text.includes('Incident')) {
                const valueSpan = label.querySelector('span');
                const value = valueSpan ? valueSpan.textContent : '';
                label.innerHTML = `${t('incidentAngle')} <span id="${valueSpan?.id || ''}">${value}</span>°`;
            } else if (text.includes('Prismavinkel') || text.includes('Prism angle')) {
                const valueSpan = label.querySelector('span');
                const value = valueSpan ? valueSpan.textContent : '';
                label.innerHTML = `${t('prismAngle')} <span id="${valueSpan?.id || ''}">${value}</span>°`;
            } else if (text.includes('Ljustyp') || text.includes('Light type')) {
                label.textContent = t('lightType');
            }
        });

        // Select options
        const refractionSelect = document.getElementById('refractionMode');
        if (refractionSelect) {
            refractionSelect.options[0].textContent = t('airToGlass');
            refractionSelect.options[1].textContent = t('glassToAir');
            refractionSelect.options[2].textContent = t('airToWater');
        }

        const prismLightSelect = document.getElementById('prismLightType');
        if (prismLightSelect) {
            prismLightSelect.options[0].textContent = t('whiteLight');
            prismLightSelect.options[1].textContent = t('redLight');
            prismLightSelect.options[2].textContent = t('greenLight');
            prismLightSelect.options[3].textContent = t('blueLight');
        }
    },

    updateBuilderLabels() {
        const t = (key) => this.t(key);

        // Toolbar sections
        const toolbarTitles = document.querySelectorAll('.toolbar-title');
        toolbarTitles.forEach(title => {
            const text = title.textContent;
            if (text.includes('Verktyg') || text === 'Tools') title.textContent = t('tools');
            else if (text.includes('Ljuskällor') || text === 'Light Sources') title.textContent = t('lightSources');
            else if (text.includes('Linser') || text === 'Lenses') title.textContent = t('lenses');
            else if (text.includes('Speglar') || text === 'Mirrors') title.textContent = t('mirrors');
            else if (text.includes('Övrigt') || text === 'Other') title.textContent = t('other');
        });

        // Tool labels
        const toolLabels = document.querySelectorAll('.tool-label');
        toolLabels.forEach(label => {
            const text = label.textContent;
            if (text.includes('Välj') || text === 'Select') label.textContent = t('select');
            else if (text.includes('Parallell') || text === 'Parallel') label.textContent = t('parallel');
            else if (text.includes('Punkt') || text === 'Point') label.textContent = t('point');
            else if (text.includes('Konvex') || text === 'Convex') label.textContent = t('convex');
            else if (text.includes('Konkav') || text === 'Concave') label.textContent = t('concave');
            else if (text.includes('Plan') || text === 'Plane') label.textContent = t('plane');
            else if (text.includes('Prisma') || text === 'Prism') label.textContent = t('prism');
            else if (text.includes('Vätska') || text === 'Liquid') label.textContent = t('liquid');
        });

        // Clear button
        const clearBtn = document.getElementById('builderClearBtn');
        if (clearBtn) clearBtn.textContent = t('clearAll');

        // Properties title
        const propsTitle = document.querySelector('.properties-title');
        if (propsTitle) propsTitle.textContent = t('properties');

        // No selection text
        const noSelection = document.querySelector('.builder-no-selection');
        if (noSelection) noSelection.textContent = t('selectElement');

        // Shortcuts
        const shortcuts = document.querySelector('.builder-shortcuts');
        if (shortcuts) shortcuts.textContent = t('shortcuts');
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
        document.getElementById('progressText').textContent = this.t('freeMode');
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
        const labIndex = this.labs.findIndex(l => l.id === labId);
        if (labIndex === -1) return;

        const steps = Translations[this.currentLang].guidedSteps[labId] || [];
        const modal = document.getElementById('helpModal');
        const title = document.getElementById('helpModalTitle');
        const content = document.getElementById('helpModalContent');

        title.textContent = `${this.t('help')}: ${this.getLabName(labIndex)}`;

        if (steps.length === 0) {
            content.innerHTML = `<p class="builder-no-selection">${this.t('noHelp')}</p>`;
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
        document.getElementById('progressText').textContent = `${this.t('labProgress')} ${this.currentLabIndex + 1}/${totalLabs}`;
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
        document.getElementById('progressText').textContent = this.currentLang === 'sv' ? 'Klart!' : 'Done!';
    },

    enterFreeExploreMode() {
        document.getElementById('completion-screen').classList.remove('active');

        this.currentLabIndex = 0;
        const lab = this.labs[0];
        document.getElementById(`${lab.id}-lab`).classList.add('active');

        lab.module.resize();
        lab.module.setDarkMode(this.isDarkMode);

        document.getElementById('progressText').textContent = this.currentLang === 'sv' ? 'Fritt läge' : 'Free mode';
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

        document.getElementById('progressText').textContent = this.getLabName(labIndex);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
