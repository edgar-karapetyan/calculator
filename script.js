// Таймеры для задержки расчета
let loanCalculationTimer;
let energyCalculationTimer;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
    initializeCalculators();
    // Запускаем первоначальный расчет
    calculateLoanWithDelay();
    calculateEnergyWithDelay();

    // Восстанавливаем выбранный калькулятор из localStorage
    restoreCalculatorState();

    // Заполняем таблицу солнечных данных
    populateSolarTable();
});

// Инициализация обработчиков событий
function initializeCalculators() {
    // Обработчики для кредитного калькулятора
    const loanInputs = ['loanAmount', 'interestRate', 'loanTerm'];
    loanInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', function () {
                calculateLoanWithDelay();
            });
        }
    });

    // Обработчики для радиокнопок типа платежей
    document.querySelectorAll('input[name="paymentType"]').forEach(radio => {
        radio.addEventListener('change', calculateLoanWithDelay);
    });

    // Обработчики для калькулятора энергии
    const energyInputs = ['energyCost', 'energyTariff'];
    energyInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', function () {
                calculateEnergyWithDelay();
            });
        }
    });

    // Обработчики для кнопок ручного расчета
    const calculateLoanBtn = document.getElementById('calculateLoan');
    const calculateEnergyBtn = document.getElementById('calculateEnergy');

    if (calculateLoanBtn) {
        calculateLoanBtn.addEventListener('click', calculateLoan);
    }
    if (calculateEnergyBtn) {
        calculateEnergyBtn.addEventListener('click', calculateEnergy);
    }

    // Обработчики для переключения между калькуляторами
    document.querySelectorAll('.switch-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            // Убираем активный класс у всех кнопок
            document.querySelectorAll('.switch-btn').forEach(b => b.classList.remove('active'));
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');

            // Скрываем все калькуляторы
            document.querySelectorAll('.calculator').forEach(calc => calc.classList.remove('active'));
            // Показываем выбранный калькулятор
            const calcId = this.getAttribute('data-calc') + '-calculator';
            const targetCalc = document.getElementById(calcId);
            if (targetCalc) {
                targetCalc.classList.add('active');
            }

            // Сохраняем состояние в localStorage
            const selectedCalc = this.getAttribute('data-calc');
            localStorage.setItem('selectedCalculator', selectedCalc);
        });
    });

    // Обработчики для фильтров солнечных панелей
    const brandFilter = document.getElementById('brandFilter');
    const typeFilter = document.getElementById('typeFilter');

    if (brandFilter) {
        brandFilter.addEventListener('change', function () {
            updateSolarTableWithFilters(this.value, typeFilter ? typeFilter.value : 'all');
        });
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', function () {
            updateSolarTableWithFilters(brandFilter ? brandFilter.value : 'all', this.value);
        });
    }
}

// Восстановление состояния калькулятора из localStorage
function restoreCalculatorState() {
    const savedCalculator = localStorage.getItem('selectedCalculator');
    if (savedCalculator) {
        // Находим соответствующую кнопку
        const targetBtn = document.querySelector(`.switch-btn[data-calc="${savedCalculator}"]`);
        if (targetBtn) {
            // Убираем активный класс у всех кнопок
            document.querySelectorAll('.switch-btn').forEach(b => b.classList.remove('active'));
            // Добавляем активный класс сохраненной кнопке
            targetBtn.classList.add('active');

            // Скрываем все калькуляторы
            document.querySelectorAll('.calculator').forEach(calc => calc.classList.remove('active'));
            // Показываем сохраненный калькулятор
            const calcId = savedCalculator + '-calculator';
            const targetCalc = document.getElementById(calcId);
            if (targetCalc) {
                targetCalc.classList.add('active');
            }
        }
    }
}

// Функции с задержкой для кредитного калькулятора
function calculateLoanWithDelay() {
    clearTimeout(loanCalculationTimer);
    loanCalculationTimer = setTimeout(calculateLoan, 800);
}

function calculateLoan() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value);
    const annualInterestRate = parseFloat(document.getElementById('interestRate').value);
    const loanTermMonths = parseInt(document.getElementById('loanTerm').value);
    const paymentTypeElement = document.querySelector('input[name="paymentType"]:checked');

    if (!paymentTypeElement) return;

    const paymentType = paymentTypeElement.value;

    if (isNaN(loanAmount) || isNaN(annualInterestRate) || isNaN(loanTermMonths) ||
        loanAmount <= 0 || annualInterestRate <= 0 || loanTermMonths <= 0) {
        return;
    }

    // Показываем индикатор загрузки
    showLoadingIndicator('loan');

    // Имитация задержки для лучшего UX
    setTimeout(() => {
        const monthlyInterestRate = annualInterestRate / 100 / 12;
        let monthlyPayment, totalPayment, overpayment;

        if (paymentType === 'annuity') {
            // Аннуитетный платеж
            const annuityCoefficient = (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTermMonths)) /
                (Math.pow(1 + monthlyInterestRate, loanTermMonths) - 1);
            monthlyPayment = loanAmount * annuityCoefficient;
            totalPayment = monthlyPayment * loanTermMonths;
            overpayment = totalPayment - loanAmount;

            const firstPaymentItem = document.getElementById('firstPaymentItem');
            const lastPaymentItem = document.getElementById('lastPaymentItem');
            if (firstPaymentItem) firstPaymentItem.classList.add('hidden');
            if (lastPaymentItem) lastPaymentItem.classList.add('hidden');
        } else {
            // Дифференцированный платеж
            const principalPayment = loanAmount / loanTermMonths;
            const firstInterest = loanAmount * monthlyInterestRate;
            const lastInterest = principalPayment * monthlyInterestRate;

            monthlyPayment = principalPayment + firstInterest;
            const lastPayment = principalPayment + lastInterest;

            const avgPayment = (monthlyPayment + lastPayment) / 2;
            totalPayment = avgPayment * loanTermMonths;
            overpayment = totalPayment - loanAmount;

            const firstPaymentElement = document.getElementById('firstPayment');
            const lastPaymentElement = document.getElementById('lastPayment');
            const firstPaymentItem = document.getElementById('firstPaymentItem');
            const lastPaymentItem = document.getElementById('lastPaymentItem');

            if (firstPaymentElement) firstPaymentElement.textContent = formatCurrency(monthlyPayment);
            if (lastPaymentElement) lastPaymentElement.textContent = formatCurrency(lastPayment);
            if (firstPaymentItem) firstPaymentItem.classList.remove('hidden');
            if (lastPaymentItem) lastPaymentItem.classList.remove('hidden');
        }

        const monthlyPaymentElement = document.getElementById('monthlyPayment');
        const totalPaymentElement = document.getElementById('totalPayment');
        const overpaymentElement = document.getElementById('overpayment');

        if (monthlyPaymentElement) monthlyPaymentElement.textContent = formatCurrency(monthlyPayment);
        if (totalPaymentElement) totalPaymentElement.textContent = formatCurrency(totalPayment);
        if (overpaymentElement) overpaymentElement.textContent = formatCurrency(overpayment);

        generateSchedule(loanAmount, monthlyInterestRate, monthlyPayment, loanTermMonths, paymentType);
        createChart(loanAmount, monthlyInterestRate, loanTermMonths, paymentType);

        // Скрываем индикатор загрузки
        hideLoadingIndicator('loan');

    }, 300);
}

// Функции с задержкой для калькулятора энергии
function calculateEnergyWithDelay() {
    clearTimeout(energyCalculationTimer);
    energyCalculationTimer = setTimeout(calculateEnergy, 800);
}

function calculateEnergy() {
    const cost = parseFloat(document.getElementById('energyCost').value);
    const tariff = parseFloat(document.getElementById('energyTariff').value);

    if (isNaN(cost) || isNaN(tariff) || cost <= 0 || tariff <= 0) {
        // Очищаем рекомендации, если данные невалидны
        const recommendationsContainer = document.getElementById('solarRecommendations');
        if (recommendationsContainer) recommendationsContainer.innerHTML = '';
        return;
    }

    // Показываем индикатор загрузки
    showLoadingIndicator('energy');

    // Имитация задержки для лучшего UX
    setTimeout(() => {
        const consumption = cost / tariff;
        const dailyConsumption = consumption / 30;
        const monthlyConsumption = consumption;

        const energyConsumptionElement = document.getElementById('energyConsumption');
        const totalCostElement = document.getElementById('totalCost');
        const dailyConsumptionElement = document.getElementById('dailyConsumption');
        const monthlyConsumptionElement = document.getElementById('monthlyConsumption');

        if (energyConsumptionElement) energyConsumptionElement.textContent = `${consumption.toFixed(2)} кВт·ч`;
        if (totalCostElement) totalCostElement.textContent = formatCurrency(cost);
        if (dailyConsumptionElement) dailyConsumptionElement.textContent = `${dailyConsumption.toFixed(2)}`;
        if (monthlyConsumptionElement) monthlyConsumptionElement.textContent = `${monthlyConsumption.toFixed(2)}`;

        // Получаем и отображаем рекомендации по солнечным панелям
        displaySolarRecommendations(cost);

        // Скрываем индикатор загрузки
        hideLoadingIndicator('energy');

    }, 300);
}

// Функция форматирования валюты в армянские драмы
function formatCurrency(amount) {
    return `${amount.toFixed(2).toLocaleString('ru-RU')} ֏`;
}

// Функции для индикаторов загрузки
function showLoadingIndicator(type) {
    const calculateBtn = type === 'loan' ?
        document.getElementById('calculateLoan') :
        document.getElementById('calculateEnergy');

    if (!calculateBtn) return;

    const originalText = calculateBtn.innerHTML;
    calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Расчет...';
    calculateBtn.disabled = true;

    // Сохраняем оригинальный текст для восстановления
    calculateBtn.setAttribute('data-original-text', originalText);
}

function hideLoadingIndicator(type) {
    const calculateBtn = type === 'loan' ?
        document.getElementById('calculateLoan') :
        document.getElementById('calculateEnergy');

    if (!calculateBtn) return;

    const originalText = calculateBtn.getAttribute('data-original-text');
    if (originalText) {
        calculateBtn.innerHTML = originalText;
    }
    calculateBtn.disabled = false;
}

// Вспомогательные функции для кредитного калькулятора
function generateSchedule(loanAmount, monthlyInterestRate, monthlyPayment, loanTermMonths, paymentType) {
    const scheduleBody = document.getElementById('scheduleBody');
    if (!scheduleBody) return;

    scheduleBody.innerHTML = '';

    let remainingDebt = loanAmount;
    const maxRows = Math.min(12, loanTermMonths);

    for (let month = 1; month <= maxRows; month++) {
        const interestPayment = remainingDebt * monthlyInterestRate;
        let principalPayment;

        if (paymentType === 'annuity') {
            principalPayment = monthlyPayment - interestPayment;
        } else {
            principalPayment = loanAmount / loanTermMonths;
        }

        remainingDebt -= principalPayment;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${month}</td>
            <td>${formatCurrency(principalPayment + interestPayment)}</td>
            <td>${formatCurrency(principalPayment)}</td>
            <td>${formatCurrency(interestPayment)}</td>
            <td>${formatCurrency(Math.max(remainingDebt, 0))}</td>
        `;
        scheduleBody.appendChild(row);
    }

    // Добавляем строку с информацией об остальных платежах
    if (loanTermMonths > maxRows) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="5" style="text-align: center; font-style: italic;">
                ... и еще ${loanTermMonths - maxRows} платежей
            </td>
        `;
        scheduleBody.appendChild(row);
    }
}

function createChart(loanAmount, monthlyInterestRate, loanTermMonths, paymentType) {
    const chartCanvas = document.getElementById('paymentChart');
    if (!chartCanvas) return;

    const ctx = chartCanvas.getContext('2d');

    // Уничтожаем предыдущий график если существует
    if (window.loanChart) {
        window.loanChart.destroy();
    }

    const labels = [];
    const paymentData = [];
    const principalData = [];
    const interestData = [];

    // Создаем данные для графика (каждый 3-й месяц для читаемости)
    const step = Math.max(1, Math.floor(loanTermMonths / 12));

    for (let month = 1; month <= loanTermMonths; month += step) {
        labels.push(`Месяц ${month}`);

        if (paymentType === 'annuity') {
            const annuityCoefficient = (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTermMonths)) /
                (Math.pow(1 + monthlyInterestRate, loanTermMonths) - 1);
            const monthlyPayment = loanAmount * annuityCoefficient;
            paymentData.push(monthlyPayment);

            // Расчет для конкретного месяца
            let remaining = loanAmount;
            let currentPrincipal = 0;
            let currentInterest = 0;

            for (let m = 1; m <= month; m++) {
                currentInterest = remaining * monthlyInterestRate;
                currentPrincipal = monthlyPayment - currentInterest;
                remaining -= currentPrincipal;
            }

            principalData.push(currentPrincipal);
            interestData.push(currentInterest);

        } else {
            const principal = loanAmount / loanTermMonths;
            const interest = (loanAmount - (principal * (month - 1))) * monthlyInterestRate;
            paymentData.push(principal + interest);
            principalData.push(principal);
            interestData.push(interest);
        }
    }

    // Добавляем последний месяц если его нет
    if (labels[labels.length - 1] !== `Месяц ${loanTermMonths}`) {
        labels.push(`Месяц ${loanTermMonths}`);

        if (paymentType === 'annuity') {
            const annuityCoefficient = (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTermMonths)) /
                (Math.pow(1 + monthlyInterestRate, loanTermMonths) - 1);
            const monthlyPayment = loanAmount * annuityCoefficient;
            paymentData.push(monthlyPayment);

            // Расчет для последнего месяца
            let remaining = loanAmount;
            let currentPrincipal = 0;
            let currentInterest = 0;

            for (let m = 1; m <= loanTermMonths; m++) {
                currentInterest = remaining * monthlyInterestRate;
                currentPrincipal = monthlyPayment - currentInterest;
                remaining -= currentPrincipal;
            }

            principalData.push(currentPrincipal);
            interestData.push(currentInterest);

        } else {
            const principal = loanAmount / loanTermMonths;
            const interest = principal * monthlyInterestRate;
            paymentData.push(principal + interest);
            principalData.push(principal);
            interestData.push(interest);
        }
    }

    window.loanChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Общий платеж',
                    data: paymentData,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    tension: 0.4,
                    borderWidth: 3
                },
                {
                    label: 'Основной долг',
                    data: principalData,
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    tension: 0.4,
                    borderWidth: 2
                },
                {
                    label: 'Проценты',
                    data: interestData,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    tension: 0.4,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Динамика ${paymentType === 'annuity' ? 'аннуитетных' : 'дифференцированных'} платежей ֏`,
                    color: '#ff8400',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${context.raw.toFixed(2)} ֏`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return value.toFixed(0) + ' ֏';
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Период'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            }
        }
    });
}

// Данные для таблицы солнечных панелей
const solarData = [
    // LONGi гибридные системы
    { brand: 'LONGi', type: 'hybrid', power: 22000, count: 6, phase: 1, cost: 1290000, savings: 20300 },
    { brand: 'LONGi', type: 'hybrid', power: 25000, count: 6, phase: 1, cost: 1400000, savings: 22000 },
    { brand: 'LONGi', type: 'hybrid', power: 30000, count: 6, phase: 1, cost: 1520000, savings: 23900 },
    { brand: 'LONGi', type: 'hybrid', power: 35000, count: 6, phase: 1, cost: 1640000, savings: 25800 },
    { brand: 'LONGi', type: 'hybrid', power: 40000, count: 6, phase: 1, cost: 1760000, savings: 27700 },
    { brand: 'LONGi', type: 'hybrid', power: 43000, count: 8, phase: 1, cost: 2050000, savings: 32300 },
    { brand: 'LONGi', type: 'hybrid', power: 45000, count: 8, phase: 1, cost: 2160000, savings: 34000 },
    { brand: 'LONGi', type: 'hybrid', power: 50000, count: 8, phase: 1, cost: 2280000, savings: 35900 },
    { brand: 'LONGi', type: 'hybrid', power: 55000, count: 8, phase: 1, cost: 2400000, savings: 37800 },
    { brand: 'LONGi', type: 'hybrid', power: 60000, count: 8, phase: 1, cost: 2520000, savings: 39600 },

    // LONGi сетевые системы
    { brand: 'LONGi', type: 'grid', power: 22000, count: 6, phase: 1, cost: 990000, savings: 15600 },
    { brand: 'LONGi', type: 'grid', power: 25000, count: 6, phase: 1, cost: 1100000, savings: 17300 },
    { brand: 'LONGi', type: 'grid', power: 30000, count: 6, phase: 1, cost: 1220000, savings: 19200 },
    { brand: 'LONGi', type: 'grid', power: 35000, count: 6, phase: 1, cost: 1340000, savings: 21100 },
    { brand: 'LONGi', type: 'grid', power: 40000, count: 6, phase: 1, cost: 1460000, savings: 23000 },
    { brand: 'LONGi', type: 'grid', power: 43000, count: 8, phase: 1, cost: 1600000, savings: 25200 },
    { brand: 'LONGi', type: 'grid', power: 45000, count: 8, phase: 1, cost: 1710000, savings: 26900 },
    { brand: 'LONGi', type: 'grid', power: 50000, count: 8, phase: 1, cost: 1830000, savings: 28800 },
    { brand: 'LONGi', type: 'grid', power: 55000, count: 8, phase: 1, cost: 1950000, savings: 30700 },
    { brand: 'LONGi', type: 'grid', power: 60000, count: 8, phase: 1, cost: 2070000, savings: 32600 },

    // SWISS гибридные системы
    { brand: 'SWISS', type: 'hybrid', power: 22000, count: 6, phase: 1, cost: 1300000, savings: 20500 },
    { brand: 'SWISS', type: 'hybrid', power: 25000, count: 6, phase: 1, cost: 1420000, savings: 22400 },
    { brand: 'SWISS', type: 'hybrid', power: 30000, count: 6, phase: 1, cost: 1540000, savings: 24200 },
    { brand: 'SWISS', type: 'hybrid', power: 35000, count: 6, phase: 1, cost: 1630000, savings: 25700 },
    { brand: 'SWISS', type: 'hybrid', power: 40000, count: 6, phase: 1, cost: 1750000, savings: 27500 },
    { brand: 'SWISS', type: 'hybrid', power: 42500, count: 6, phase: 1, cost: 1860000, savings: 29300 },
    { brand: 'SWISS', type: 'hybrid', power: 45000, count: 8, phase: 1, cost: 2220000, savings: 34900 },
    { brand: 'SWISS', type: 'hybrid', power: 50000, count: 8, phase: 1, cost: 2340000, savings: 36800 },
    { brand: 'SWISS', type: 'hybrid', power: 55000, count: 8, phase: 1, cost: 2450000, savings: 38500 },
    { brand: 'SWISS', type: 'hybrid', power: 60000, count: 8, phase: 1, cost: 2570000, savings: 40400 },

    // SWISS сетевые системы
    { brand: 'SWISS', type: 'grid', power: 22000, count: 6, phase: 1, cost: 1000000, savings: 15800 },
    { brand: 'SWISS', type: 'grid', power: 25000, count: 6, phase: 1, cost: 1120000, savings: 17600 },
    { brand: 'SWISS', type: 'grid', power: 30000, count: 6, phase: 1, cost: 1240000, savings: 19500 },
    { brand: 'SWISS', type: 'grid', power: 35000, count: 6, phase: 1, cost: 1330000, savings: 20900 },
    { brand: 'SWISS', type: 'grid', power: 40000, count: 6, phase: 1, cost: 1450000, savings: 22800 },
    { brand: 'SWISS', type: 'grid', power: 42500, count: 6, phase: 1, cost: 1560000, savings: 24600 },
    { brand: 'SWISS', type: 'grid', power: 45000, count: 8, phase: 1, cost: 1770000, savings: 27900 },
    { brand: 'SWISS', type: 'grid', power: 50000, count: 8, phase: 1, cost: 1890000, savings: 29700 },
    { brand: 'SWISS', type: 'grid', power: 55000, count: 8, phase: 1, cost: 2000000, savings: 31500 },
    { brand: 'SWISS', type: 'grid', power: 60000, count: 8, phase: 1, cost: 2120000, savings: 33400 }
];

// Функция для заполнения таблицы солнечных данных
function populateSolarTable() {
    const solarDataBody = document.getElementById('solarDataBody');
    if (!solarDataBody) return;

    solarDataBody.innerHTML = '';

    solarData.forEach(item => {
        const row = document.createElement('tr');

        const systemType = item.type === 'hybrid' ? 'Гибридная' : 'Сетевая';
        const phaseText = item.phase === 1 ? '1 фаза' : '3 фазы';

        row.innerHTML = `
            <td>${item.brand}</td>
            <td>${systemType}</td>
            <td>${item.power.toLocaleString('ru-RU')} Вт</td>
            <td>${item.count} шт</td>
            <td>${phaseText}</td>
            <td>${item.cost.toLocaleString('ru-RU')} ֏</td>
            <td>${item.savings ? item.savings.toLocaleString('ru-RU') + ' ֏/мес' : '-'}</td>
        `;
        solarDataBody.appendChild(row);
    });
}

// Функция для фильтрации данных по бренду и типу
function filterSolarData(brand = 'all', type = 'all') {
    const filteredData = solarData.filter(item => {
        const brandMatch = brand === 'all' || item.brand === brand;
        const typeMatch = type === 'all' || item.type === type;
        return brandMatch && typeMatch;
    });

    return filteredData;
}

// Функция для обновления таблицы с фильтрами
function updateSolarTableWithFilters(brand = 'all', type = 'all') {
    const filteredData = filterSolarData(brand, type);
    const solarDataBody = document.getElementById('solarDataBody');

    if (!solarDataBody) return;

    solarDataBody.innerHTML = '';

    filteredData.forEach(item => {
        const row = document.createElement('tr');

        const systemType = item.type === 'hybrid' ? 'Гибридная' : 'Сетевая';
        const phaseText = item.phase === 1 ? '1 фаза' : '3 фазы';

        row.innerHTML = `
            <td>${item.brand}</td>
            <td>${systemType}</td>
            <td>${item.power.toLocaleString('ru-RU')} Вт</td>
            <td>${item.count} шт</td>
            <td>${phaseText}</td>
            <td>${item.cost.toLocaleString('ru-RU')} ֏</td>
            <td>${item.savings ? item.savings.toLocaleString('ru-RU') + ' ֏/мес' : '-'}</td>
        `;
        solarDataBody.appendChild(row);
    });
}

// Функция для получения рекомендаций на основе месячного потребления
function getSolarRecommendations(monthlyCost) {
    const recommendations = solarData
        .map(item => {
            const difference = Math.abs(item.savings - monthlyCost);
            return { ...item, difference };
        })
        .sort((a, b) => a.difference - b.difference)
        .slice(0, 3);

    return recommendations;
}

// Функция для отображения рекомендаций в интерфейсе
function displaySolarRecommendations(monthlyCost) {
    const recommendationsContainer = document.getElementById('solarRecommendations');
    if (!recommendationsContainer) return;

    const recommendations = getSolarRecommendations(monthlyCost);

    if (recommendations.length === 0) {
        recommendationsContainer.innerHTML = `
            <div class="recommendations-header">
                <h3><i class="fas fa-sun"></i> Рекомендации по солнечным панелям</h3>
            </div>
            <div class="no-recommendations">
                <p>Для вашего уровня потребления не найдено готовых решений. Свяжитесь с нами для индивидуального расчета.</p>
            </div>
        `;
        return;
    }

    let recommendationsHTML = `
        <div class="recommendations-header">
            <h3><i class="fas fa-sun"></i> Рекомендации по солнечным панелям</h3>
            <p>На основе ваших месячных затрат <strong>${formatCurrency(monthlyCost)}</strong> мы подобрали следующие варианты солнечных электростанций:</p>
        </div>
        <div class="recommendations-list">
    `;

    recommendations.forEach((item, index) => {
        const systemType = item.type === 'hybrid' ? 'Гибридная' : 'Сетевая';
        const phaseText = item.phase === 1 ? '1 фаза' : '3 фазы';

        const paybackMonths = (item.cost / item.savings).toFixed(1);
        const paybackYears = (paybackMonths / 12).toFixed(1);

        const rankClass = index === 0 ? 'top-recommendation' : 'standard-recommendation';

        recommendationsHTML += `
            <div class="recommendation-item ${rankClass}">
                <div class="recommendation-badge">${index + 1}</div>
                <div class="recommendation-content">
                    <h4>${item.brand} - ${item.power.toLocaleString('ru-RU')} Вт (${systemType})</h4>
                    <div class="recommendation-details">
                        <div class="detail-row">
                            <span class="detail-label">Количество панелей:</span>
                            <span class="detail-value">${item.count} шт.</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Тип сети:</span>
                            <span class="detail-value">${phaseText}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Стоимость:</span>
                            <span class="detail-value">${item.cost.toLocaleString('ru-RU')} ֏</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Экономия в месяц:</span>
                            <span class="detail-value">~${item.savings.toLocaleString('ru-RU')} ֏</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Примерный срок окупаемости:</span>
                            <span class="detail-value">~ ${paybackYears.slice(0, paybackYears.indexOf('.'))} лет ${paybackYears.slice(paybackYears.indexOf('.') + 1, paybackYears.length)} мес.</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    recommendationsHTML += `</div>`;
    recommendationsContainer.innerHTML = recommendationsHTML;
}

let check = 0;
document.querySelector('.calculator-switcher_open_close').addEventListener('click', () => {
    if (check === 0) {
        document.querySelector('.calculator-switcher').classList.add('calculator-switcher-open');
        document.querySelector('.calculator-switcher_open_close').classList.add('calculator-switcher_open_close-active')
        check = 1;
    } else {
        document.querySelector('.calculator-switcher').classList.remove('calculator-switcher-open');
        document.querySelector('.calculator-switcher_open_close').classList.remove('calculator-switcher_open_close-active')
        check = 0;
    }
    console.log(check);
});
