// Таймеры для задержки расчета
let loanCalculationTimer;
let energyCalculationTimer;
let check = 0;

// Данные тепловых насосов из PDF
const heatPumpData = [
    {
        model: "092A/BEF/100W",
        powerRange: "5.8-10 кВт",
        consumptionRange: "60-120",
        performance: "2.3-2.8",
        cost: 1400000,
        savings: 650
    },
    {
        model: "092A/BEF/121A-AKW", 
        powerRange: "8.5-12.4 кВт",
        consumptionRange: "100-150",
        performance: "4.7-5.5",
        cost: 1440000,
        savings: 1100
    },
    {
        model: "202A/BEF/200W",
        powerRange: "13-20 кВт", 
        consumptionRange: "130-220",
        performance: "5.1-6",
        cost: 1400000,
        savings: 1400
    },
    {
        model: "202A/BEF/200W",
        powerRange: "13-20 кВт",
        consumptionRange: "130-220", 
        performance: "5.1-6",
        cost: 1500000,
        savings: 1400
    },
    {
        model: "242A/SBEF/24AW",
        powerRange: "15-24 кВт",
        consumptionRange: "150-240",
        performance: "5.9-7.4", 
        cost: 1650000,
        savings: 1600
    },
    {
        model: "060ZA/BEF/22A-AKW",
        powerRange: "17-24.7 кВт",
        consumptionRange: "180-300",
        performance: "9.3-10.2",
        cost: 2400000,
        savings: 2000
    }
];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
    initializeCalculators();
    calculateLoanWithDelay();
    calculateEnergyWithDelay();
    restoreCalculatorState();
    populateSolarTable();
    populateHeatPumpTable();
    initializeSwitcherToggle();
});

// Инициализация обработчиков событий
function initializeCalculators() {
    applyNumberFormattingToAllInputs();

    const loanInputs = ['loanAmount', 'interestRate', 'loanTerm'];
    loanInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', calculateLoanWithDelay);
        }
    });

    document.querySelectorAll('input[name="paymentType"]').forEach(radio => {
        radio.addEventListener('change', calculateLoanWithDelay);
    });

    const energyInputs = ['energyCost', 'energyTariff'];
    energyInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', calculateEnergyWithDelay);
        }
    });

    const calculateLoanBtn = document.getElementById('calculateLoan');
    const calculateEnergyBtn = document.getElementById('calculateEnergy');

    if (calculateLoanBtn) {
        calculateLoanBtn.addEventListener('click', calculateLoan);
    }
    if (calculateEnergyBtn) {
        calculateEnergyBtn.addEventListener('click', calculateEnergy);
    }

    document.querySelectorAll('.switch-btn').forEach(btn => {
        btn.addEventListener('click', handleSwitchBtnClick);
    });

    const brandFilter = document.getElementById('brandFilter');
    const typeFilter = document.getElementById('typeFilter');
    const pumpModelFilter = document.getElementById('pumpModelFilter');

    if (brandFilter) brandFilter.addEventListener('change', handleFilterChange);
    if (typeFilter) typeFilter.addEventListener('change', handleFilterChange);
    if (pumpModelFilter) pumpModelFilter.addEventListener('change', handleHeatPumpFilterChange);
}

// Функции для кредитного калькулятора
function calculateLoanWithDelay() {
    clearTimeout(loanCalculationTimer);
    loanCalculationTimer = setTimeout(calculateLoan, 800);
}

function calculateLoan() {
    const loanAmount = parseFloat(unformatNumber(document.getElementById('loanAmount').value));
    const annualInterestRate = parseFloat(unformatNumber(document.getElementById('interestRate').value));
    const loanTermYears = parseFloat(unformatNumber(document.getElementById('loanTerm').value));
    const paymentTypeElement = document.querySelector('input[name="paymentType"]:checked');

    if (!paymentTypeElement) return;

    const paymentType = paymentTypeElement.value;

    if (isNaN(loanAmount) || isNaN(annualInterestRate) || isNaN(loanTermYears) ||
        loanAmount <= 0 || annualInterestRate <= 0 || loanTermYears <= 0) {
        return;
    }

    showLoadingIndicator('loan');

    setTimeout(() => {
        const loanTermMonths = loanTermYears * 12;
        const monthlyInterestRate = annualInterestRate / 100 / 12;
        let monthlyPayment, totalPayment, overpayment;

        if (paymentType === 'annuity') {
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
        hideLoadingIndicator('loan');
    }, 300);
}

// Функции для калькулятора энергии
function calculateEnergyWithDelay() {
    clearTimeout(energyCalculationTimer);
    energyCalculationTimer = setTimeout(calculateEnergy, 800);
}

function calculateEnergy() {
    const cost = parseFloat(unformatNumber(document.getElementById('energyCost').value));
    const tariff = parseFloat(unformatNumber(document.getElementById('energyTariff').value));

    if (isNaN(cost) || isNaN(tariff) || cost <= 0 || tariff <= 0) {
        const recommendationsContainer = document.getElementById('solarRecommendations');
        if (recommendationsContainer) recommendationsContainer.innerHTML = '';
        return;
    }

    showLoadingIndicator('energy');

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

        displaySolarRecommendations(cost);
        hideLoadingIndicator('energy');
    }, 300);
}

// Функции для тепловых насосов
function populateHeatPumpTable() {
    const heatPumpDataBody = document.getElementById('heatPumpDataBody');
    if (!heatPumpDataBody) return;

    heatPumpDataBody.innerHTML = '';

    heatPumpData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.model}</td>
            <td>${item.powerRange}</td>
            <td>${item.consumptionRange}</td>
            <td>${item.performance}</td>
            <td>${item.cost.toLocaleString('ru-RU')} ֏</td>
            <td>${item.savings.toLocaleString('ru-RU')} ֏/мес</td>
        `;
        heatPumpDataBody.appendChild(row);
    });
}

function filterHeatPumpData(model = 'all') {
    return heatPumpData.filter(item => {
        return model === 'all' || item.model.includes(model);
    });
}

function updateHeatPumpTableWithFilters(model = 'all') {
    const filteredData = filterHeatPumpData(model);
    const heatPumpDataBody = document.getElementById('heatPumpDataBody');

    if (!heatPumpDataBody) return;

    heatPumpDataBody.innerHTML = '';

    filteredData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.model}</td>
            <td>${item.powerRange}</td>
            <td>${item.consumptionRange}</td>
            <td>${item.performance}</td>
            <td>${item.cost.toLocaleString('ru-RU')} ֏</td>
            <td>${item.savings.toLocaleString('ru-RU')} ֏/мес</td>
        `;
        heatPumpDataBody.appendChild(row);
    });
}

function handleHeatPumpFilterChange() {
    const modelFilter = document.getElementById('pumpModelFilter');
    updateHeatPumpTableWithFilters(modelFilter ? modelFilter.value : 'all');
}

// Вспомогательные функции
function formatCurrency(amount) {
    return `${amount.toFixed(2).toLocaleString('ru-RU')} ֏`;
}

function showLoadingIndicator(type) {
    const calculateBtn = type === 'loan' ?
        document.getElementById('calculateLoan') :
        document.getElementById('calculateEnergy');

    if (!calculateBtn) return;

    const originalText = calculateBtn.innerHTML;
    calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Расчет...';
    calculateBtn.disabled = true;
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

// Остальные функции (generateSchedule, createChart, populateSolarTable, displaySolarRecommendations и т.д.)
// ... (добавьте остальные функции из предыдущего кода)

// Переключение калькуляторов
function handleSwitchBtnClick() {
    document.querySelectorAll('.switch-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');

    document.querySelectorAll('.calculator').forEach(calc => calc.classList.remove('active'));
    const calcId = this.getAttribute('data-calc') + '-calculator';
    const targetCalc = document.getElementById(calcId);
    if (targetCalc) {
        targetCalc.classList.add('active');
    }

    const selectedCalc = this.getAttribute('data-calc');
    localStorage.setItem('selectedCalculator', selectedCalc);

    document.querySelector('.calculator-switcher').classList.remove('calculator-switcher-open');
    document.querySelector('.calculator-switcher_open_close').classList.remove('calculator-switcher_open_close-active');
    check = 0;
}

function restoreCalculatorState() {
    const savedCalculator = localStorage.getItem('selectedCalculator');
    if (savedCalculator) {
        const targetBtn = document.querySelector(`.switch-btn[data-calc="${savedCalculator}"]`);
        if (targetBtn) {
            targetBtn.click();
        }
    }
}

function initializeSwitcherToggle() {
    const switcherToggle = document.querySelector('.calculator-switcher_open_close');
    if (switcherToggle) {
        switcherToggle.addEventListener('click', handleSwitcherToggle);
    }
}

function handleSwitcherToggle() {
    const switcher = document.querySelector('.calculator-switcher');
    const toggleBtn = document.querySelector('.calculator-switcher_open_close');

    if (check === 0) {
        switcher.classList.add('calculator-switcher-open');
        toggleBtn.classList.add('calculator-switcher_open_close-active');
        check = 1;
    } else {
        switcher.classList.remove('calculator-switcher-open');
        toggleBtn.classList.remove('calculator-switcher_open_close-active');
        check = 0;
    }
}

// Функции форматирования чисел
function applyNumberFormattingToAllInputs() {
    const inputs = document.querySelectorAll('input[type="number"], input[type="text"]');
    inputs.forEach(input => {
        if (isNumberField(input)) {
            applyNumberFormatting(input);
        }
    });
}

function isNumberField(input) {
    return (
        input.type === 'number' ||
        input.getAttribute('inputmode') === 'numeric' ||
        input.classList.contains('number-input') ||
        input.getAttribute('name')?.includes('number') ||
        input.getAttribute('id')?.includes('number') ||
        input.getAttribute('data-type') === 'number'
    );
}

function applyNumberFormatting(input) {
    if (input.hasAttribute('data-formatted')) return;
    formatInputValue(input);
    input.addEventListener('blur', () => formatInputValue(input));
    input.addEventListener('focus', () => unformatInputValue(input));
    input.addEventListener('input', handleNumberInput);
    input.setAttribute('data-formatted', 'true');
}

function formatInputValue(input) {
    if (input.value && input.value.trim() !== '') {
        const cursorPosition = input.selectionStart;
        const valueBeforeFormat = input.value;
        input.value = formatNumber(input.value);
        const addedChars = input.value.length - valueBeforeFormat.length;
        input.setSelectionRange(cursorPosition + addedChars, cursorPosition + addedChars);
    }
}

function unformatInputValue(input) {
    if (input.value) {
        const cursorPosition = input.selectionStart;
        const valueBeforeUnformat = input.value;
        input.value = input.value.replace(/\./g, '');
        const removedChars = valueBeforeUnformat.length - input.value.length;
        const newCursorPosition = Math.max(0, cursorPosition - removedChars);
        input.setSelectionRange(newCursorPosition, newCursorPosition);
    }
}

function handleNumberInput(e) {
    const input = e.target;
    let value = input.value;
    const cursorPosition = input.selectionStart;
    value = value.replace(/[^\d,.]/g, '');
    const decimalSeparators = value.match(/[,.]/g);
    if (decimalSeparators && decimalSeparators.length > 1) {
        const firstSeparatorIndex = value.search(/[,.]/);
        value = value.substring(0, firstSeparatorIndex + 1) +
            value.substring(firstSeparatorIndex + 1).replace(/[,.]/g, '');
    }
    input.value = value;
    input.setSelectionRange(cursorPosition, cursorPosition);
}

function formatNumber(number) {
    if (!number && number !== 0) return '';
    let numStr = number.toString().replace(/\s/g, '');
    numStr = numStr.replace(/\./g, '');
    numStr = numStr.replace(',', '.');
    const parts = numStr.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return parts.length > 1 ? parts[0] + ',' + parts[1] : parts[0];
}

function unformatNumber(formattedNumber) {
    if (!formattedNumber) return '';
    return formattedNumber.toString()
        .replace(/\./g, '')
        .replace(',', '.');
}

// Observer для динамически добавляемых элементов
const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) {
                const inputs = node.querySelectorAll ?
                    node.querySelectorAll('input[type="number"], input[type="text"]') : [];
                inputs.forEach(input => {
                    if (isNumberField(input) && !input.hasAttribute('data-formatted')) {
                        applyNumberFormatting(input);
                        input.setAttribute('data-formatted', 'true');
                    }
                });
            }
        });
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});








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
        const remainingMonths = loanTermMonths - maxRows;
        const remainingYears = Math.floor(remainingMonths / 12);
        const remainingMonthsOnly = remainingMonths % 12;

        let remainingText = '';
        if (remainingYears > 0 && remainingMonthsOnly > 0) {
            remainingText = `... и еще ${remainingYears} год ${remainingMonthsOnly} месяцев`;
        } else if (remainingYears > 0) {
            remainingText = `... и еще ${remainingYears} лет`;
        } else {
            remainingText = `... и еще ${remainingMonthsOnly} месяцев`;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="5" style="text-align: center; font-style: italic;">
                ${remainingText}
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

    // Создаем данные для графика (помесячно для первого года, потом поквартально)
    let step = 1;
    if (loanTermMonths > 24) {
        step = 3; // Показывать поквартально после 2 лет
    }
    if (loanTermMonths > 60) {
        step = 6; // Показывать раз в полгода после 5 лет
    }

    for (let month = 1; month <= loanTermMonths; month += step) {
        // Форматируем метку в годах и месяцах
        const years = Math.floor(month / 12);
        const months = month % 12;

        let label = '';
        if (years > 0 && months > 0) {
            label = `${years} год ${months} мес`;
        } else if (years > 0) {
            label = `${years} год`;
        } else {
            label = `${months} мес`;
        }

        labels.push(label);

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
    if (loanTermMonths % step !== 0) {
        const years = Math.floor(loanTermMonths / 12);
        const months = loanTermMonths % 12;

        let label = '';
        if (years > 0 && months > 0) {
            label = `${years} год ${months} мес`;
        } else if (years > 0) {
            label = `${years} год`;
        } else {
            label = `${months} мес`;
        }

        labels.push(label);

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
                    label: 'Ежемесячный платеж',
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
                    text: `Динамика ${paymentType === 'annuity' ? 'аннуитетных' : 'дифференцированных'} платежей`,
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
                            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return formatCurrency(value);
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Период (годы и месяцы)'
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
    { brand: 'LONGi', type: 'hybrid', power: 65000, count: 8, phase: 1, cost: 2640000, savings: 41500 },
    { brand: 'LONGi', type: 'hybrid', power: 65000, count: 10, phase: 1, cost: 2790000, savings: 43900 },
    { brand: 'LONGi', type: 'hybrid', power: 68000, count: 10, phase: 1, cost: 2910000, savings: 45800 },
    { brand: 'LONGi', type: 'hybrid', power: 70000, count: 10, phase: 1, cost: 3020000, savings: 47500 },
    { brand: 'LONGi', type: 'hybrid', power: 75000, count: 10, phase: 1, cost: 3140000, savings: 49400 },
    { brand: 'LONGi', type: 'hybrid', power: 50000, count: 10, phase: 3, cost: 2550000, savings: 40100 },
    { brand: 'LONGi', type: 'hybrid', power: 55000, count: 10, phase: 3, cost: 2660000, savings: 41800 },
    { brand: 'LONGi', type: 'hybrid', power: 60000, count: 10, phase: 3, cost: 2770000, savings: 43600 },
    { brand: 'LONGi', type: 'hybrid', power: 65000, count: 10, phase: 3, cost: 2890000, savings: 45400 },
    { brand: 'LONGi', type: 'hybrid', power: 68000, count: 10, phase: 3, cost: 3000000, savings: 47200 },
    { brand: 'LONGi', type: 'hybrid', power: 70000, count: 10, phase: 3, cost: 3110000, savings: 48900 },
    { brand: 'LONGi', type: 'hybrid', power: 75000, count: 10, phase: 3, cost: 3220000, savings: 50600 },
    { brand: 'LONGi', type: 'hybrid', power: 77000, count: 15, phase: 3, cost: 3490000, savings: 54900 },
    { brand: 'LONGi', type: 'hybrid', power: 80000, count: 15, phase: 3, cost: 3600000, savings: 56600 },
    { brand: 'LONGi', type: 'hybrid', power: 90000, count: 15, phase: 3, cost: 3710000, savings: 58300 },
    { brand: 'LONGi', type: 'hybrid', power: 100000, count: 15, phase: 3, cost: 3820000, savings: 60100 },
    { brand: 'LONGi', type: 'hybrid', power: 105000, count: 15, phase: 3, cost: 3940000, savings: 61900 },
    { brand: 'LONGi', type: 'hybrid', power: 110000, count: 15, phase: 3, cost: 4140000, savings: 65100 },
    { brand: 'LONGi', type: 'hybrid', power: 120000, count: 20, phase: 3, cost: 4510000, savings: 70900 },
    { brand: 'LONGi', type: 'hybrid', power: 130000, count: 20, phase: 3, cost: 4730000, savings: 74400 },
    { brand: 'LONGi ?', type: 'hybrid', power: 140000, count: 20, phase: 3, cost: 4960000, savings: 78000 },
    { brand: 'LONGi ?', type: 'hybrid', power: 150000, count: 20, phase: 3, cost: 5180000, savings: 81500 },
    { brand: 'LONGi ?', type: 'hybrid', power: 160000, count: 25, phase: 3, cost: 5750000, savings: 90400 },
    { brand: 'LONGi ?', type: 'hybrid', power: 170000, count: 25, phase: 3, cost: 5980000, savings: 94000 },
    { brand: 'LONGi ?', type: 'hybrid', power: 180000, count: 25, phase: 3, cost: 6320000, savings: 99400 },
    { brand: 'LONGi ?', type: 'hybrid', power: 190000, count: 25, phase: 3, cost: 6540000, savings: 102900 },
    { brand: 'LONGi ?', type: 'hybrid', power: 200000, count: 30, phase: 3, cost: 6890000, savings: 108400 },
    { brand: 'LONGi ?', type: 'hybrid', power: 210000, count: 30, phase: 3, cost: 7230000, savings: 113700 },
    { brand: 'LONGi ?', type: 'hybrid', power: 220000, count: 30, phase: 3, cost: 7450000, savings: 117200 },
    { brand: 'LONGi ?', type: 'hybrid', power: 230000, count: 30, phase: 3, cost: 7930000, savings: 124700 },
    { brand: 'LONGi ?', type: 'hybrid', power: 240000, count: 30, phase: 3, cost: 8160000, savings: 128300 },
    { brand: 'LONGi ?', type: 'hybrid', power: 250000, count: 30, phase: 3, cost: 8370000, savings: 131600 },

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
    { brand: 'LONGi', type: 'grid', power: 65000, count: 8, phase: 1, cost: 2190000, savings: 34500 },
    { brand: 'LONGi', type: 'grid', power: 65000, count: 10, phase: 1, cost: 2280000, savings: 35900 },
    { brand: 'LONGi', type: 'grid', power: 68000, count: 10, phase: 1, cost: 2400000, savings: 37800 },
    { brand: 'LONGi', type: 'grid', power: 70000, count: 10, phase: 1, cost: 2510000, savings: 39500 },
    { brand: 'LONGi', type: 'grid', power: 75000, count: 10, phase: 1, cost: 2630000, savings: 41400 },
    { brand: 'LONGi', type: 'grid', power: 50000, count: 10, phase: 3, cost: 2010000, savings: 31600 },
    { brand: 'LONGi', type: 'grid', power: 55000, count: 10, phase: 3, cost: 2120000, savings: 33400 },
    { brand: 'LONGi', type: 'grid', power: 60000, count: 10, phase: 3, cost: 2230000, savings: 35100 },
    { brand: 'LONGi', type: 'grid', power: 65000, count: 10, phase: 3, cost: 2350000, savings: 37000 },
    { brand: 'LONGi', type: 'grid', power: 68000, count: 10, phase: 3, cost: 2460000, savings: 38700 },
    { brand: 'LONGi', type: 'grid', power: 70000, count: 10, phase: 3, cost: 2570000, savings: 40400 },
    { brand: 'LONGi', type: 'grid', power: 75000, count: 10, phase: 3, cost: 2680000, savings: 42100 },
    { brand: 'LONGi', type: 'grid', power: 77000, count: 15, phase: 3, cost: 2830000, savings: 44500 },
    { brand: 'LONGi', type: 'grid', power: 80000, count: 15, phase: 3, cost: 2940000, savings: 46200 },
    { brand: 'LONGi', type: 'grid', power: 90000, count: 15, phase: 3, cost: 3050000, savings: 48000 },
    { brand: 'LONGi', type: 'grid', power: 100000, count: 15, phase: 3, cost: 3160000, savings: 49700 },
    { brand: 'LONGi', type: 'grid', power: 105000, count: 15, phase: 3, cost: 3280000, savings: 51600 },
    { brand: 'LONGi', type: 'grid', power: 110000, count: 15, phase: 3, cost: 3390000, savings: 53300 },
    { brand: 'LONGi', type: 'grid', power: 120000, count: 20, phase: 3, cost: 3760000, savings: 59100 },
    { brand: 'LONGi', type: 'grid', power: 130000, count: 20, phase: 3, cost: 3980000, savings: 62600 },
    { brand: 'LONGi', type: 'grid', power: 140000, count: 20, phase: 3, cost: 4210000, savings: 66200 },
    { brand: 'LONGi', type: 'grid', power: 150000, count: 20, phase: 3, cost: 4430000, savings: 69600 },
    { brand: 'LONGi ?', type: 'grid', power: 160000, count: 25, phase: 3, cost: 4910000, savings: 77200 },
    { brand: 'LONGi ?', type: 'grid', power: 170000, count: 25, phase: 3, cost: 5140000, savings: 80800 },
    { brand: 'LONGi ?', type: 'grid', power: 180000, count: 25, phase: 3, cost: 5480000, savings: 86200 },
    { brand: 'LONGi ?', type: 'grid', power: 190000, count: 25, phase: 3, cost: 5700000, savings: 89600 },
    { brand: 'LONGi ?', type: 'grid', power: 200000, count: 30, phase: 3, cost: 5930000, savings: 93300 },
    { brand: 'LONGi ?', type: 'grid', power: 210000, count: 30, phase: 3, cost: 6270000, savings: 98600 },
    { brand: 'LONGi ?', type: 'grid', power: 220000, count: 30, phase: 3, cost: 6490000, savings: 102100 },
    { brand: 'LONGi ?', type: 'grid', power: 230000, count: 40, phase: 3, cost: 6970000, savings: 109600 },
    { brand: 'LONGi ?', type: 'grid', power: 240000, count: 40, phase: 3, cost: 7200000, savings: 113300 },
    { brand: 'LONGi ?', type: 'grid', power: 250000, count: 40, phase: 3, cost: 7530000, savings: 118400 },
    { brand: 'LONGi ?', type: 'grid', power: 260000, count: 40, phase: 3, cost: 7760000, savings: 122100 },
    { brand: 'LONGi ?', type: 'grid', power: 270000, count: 40, phase: 3, cost: 8100000, savings: 127400 },
    { brand: 'LONGi ?', type: 'grid', power: 280000, count: 40, phase: 3, cost: 8320000, savings: 130900 },
    { brand: 'LONGi ?', type: 'grid', power: 290000, count: 40, phase: 3, cost: 8660000, savings: 136200 },
    { brand: 'LONGi ?', type: 'grid', power: 300000, count: 40, phase: 3, cost: 8890000, savings: 139800 },

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
    { brand: 'SWISS', type: 'hybrid', power: 65000, count: 8, phase: 1, cost: 2670000, savings: 42000 },
    { brand: 'SWISS', type: 'hybrid', power: 65000, count: 8, phase: 1, cost: 2790000, savings: 43900 },
    { brand: 'SWISS', type: 'hybrid', power: 68000, count: 10, phase: 1, cost: 2930000, savings: 46100 },
    { brand: 'SWISS', type: 'hybrid', power: 70000, count: 10, phase: 1, cost: 3060000, savings: 48100 },
    { brand: 'SWISS', type: 'hybrid', power: 75000, count: 10, phase: 1, cost: 3160000, savings: 49700 },
    { brand: 'SWISS', type: 'hybrid', power: 50000, count: 10, phase: 3, cost: 2540000, savings: 39900 },
    { brand: 'SWISS', type: 'hybrid', power: 55000, count: 10, phase: 3, cost: 2650000, savings: 41700 },
    { brand: 'SWISS', type: 'hybrid', power: 60000, count: 10, phase: 3, cost: 2660000, savings: 41800 },
    { brand: 'SWISS', type: 'hybrid', power: 65000, count: 10, phase: 3, cost: 2870000, savings: 45100 },
    { brand: 'SWISS', type: 'hybrid', power: 68000, count: 10, phase: 3, cost: 2980000, savings: 46900 },
    { brand: 'SWISS', type: 'hybrid', power: 70000, count: 10, phase: 3, cost: 3090000, savings: 48600 },
    { brand: 'SWISS', type: 'hybrid', power: 75000, count: 10, phase: 3, cost: 3200000, savings: 50300 },
    { brand: 'SWISS', type: 'hybrid', power: 77000, count: 15, phase: 3, cost: 3460000, savings: 54400 },
    { brand: 'SWISS', type: 'hybrid', power: 80000, count: 15, phase: 3, cost: 3570000, savings: 56100 },
    { brand: 'SWISS', type: 'hybrid', power: 90000, count: 15, phase: 3, cost: 3790000, savings: 59600 },
    { brand: 'SWISS', type: 'hybrid', power: 100000, count: 15, phase: 3, cost: 3990000, savings: 62700 },
    { brand: 'SWISS', type: 'hybrid', power: 105000, count: 15, phase: 3, cost: 4100000, savings: 64500 },
    { brand: 'SWISS', type: 'hybrid', power: 110000, count: 15, phase: 3, cost: 4320000, savings: 67900 },
    { brand: 'SWISS', type: 'hybrid', power: 120000, count: 15, phase: 3, cost: 4550000, savings: 71500 },
    { brand: 'SWISS ?', type: 'hybrid', power: 130000, count: 20, phase: 3, cost: 4960000, savings: 78000 },
    { brand: 'SWISS ?', type: 'hybrid', power: 135000, count: 20, phase: 3, cost: 5180000, savings: 81400 },
    { brand: 'SWISS ?', type: 'hybrid', power: 140000, count: 20, phase: 3, cost: 5290000, savings: 83200 },
    { brand: 'SWISS ?', type: 'hybrid', power: 150000, count: 20, phase: 3, cost: 5400000, savings: 84900 },
    { brand: 'SWISS ?', type: 'hybrid', power: 160000, count: 25, phase: 3, cost: 5900000, savings: 92800 },
    { brand: 'SWISS ?', type: 'hybrid', power: 170000, count: 25, phase: 3, cost: 6130000, savings: 96400 },
    { brand: 'SWISS ?', type: 'hybrid', power: 180000, count: 25, phase: 3, cost: 6460000, savings: 101600 },
    { brand: 'SWISS ?', type: 'hybrid', power: 190000, count: 25, phase: 3, cost: 6680000, savings: 105100 },
    { brand: 'SWISS ?', type: 'hybrid', power: 200000, count: 30, phase: 3, cost: 7160000, savings: 112600 },
    { brand: 'SWISS ?', type: 'hybrid', power: 210000, count: 30, phase: 3, cost: 7380000, savings: 116100 },
    { brand: 'SWISS ?', type: 'hybrid', power: 220000, count: 30, phase: 3, cost: 7710000, savings: 121300 },
    { brand: 'SWISS ?', type: 'hybrid', power: 230000, count: 30, phase: 3, cost: 7930000, savings: 124700 },
    { brand: 'SWISS ?', type: 'hybrid', power: 240000, count: 30, phase: 3, cost: 8160000, savings: 128300 },
    { brand: 'SWISS ?', type: 'hybrid', power: 250000, count: 30, phase: 3, cost: 8500000, savings: 133700 },

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
    { brand: 'SWISS', type: 'grid', power: 60000, count: 8, phase: 1, cost: 2120000, savings: 33400 },
    { brand: 'SWISS', type: 'grid', power: 65000, count: 8, phase: 1, cost: 2220000, savings: 34900 },
    { brand: 'SWISS', type: 'grid', power: 65000, count: 8, phase: 1, cost: 2340000, savings: 36800 },
    { brand: 'SWISS', type: 'grid', power: 68000, count: 10, phase: 1, cost: 2420000, savings: 38100 },
    { brand: 'SWISS', type: 'grid', power: 70000, count: 10, phase: 1, cost: 2550000, savings: 40100 },
    { brand: 'SWISS', type: 'grid', power: 75000, count: 10, phase: 1, cost: 2650000, savings: 41700 },
    { brand: 'SWISS', type: 'grid', power: 50000, count: 10, phase: 3, cost: 2000000, savings: 31500 },
    { brand: 'SWISS', type: 'grid', power: 55000, count: 10, phase: 3, cost: 2110000, savings: 33200 },
    { brand: 'SWISS', type: 'grid', power: 60000, count: 10, phase: 3, cost: 2120000, savings: 33400 },
    { brand: 'SWISS', type: 'grid', power: 65000, count: 10, phase: 3, cost: 2330000, savings: 36700 },
    { brand: 'SWISS', type: 'grid', power: 68000, count: 10, phase: 3, cost: 2440000, savings: 38400 },
    { brand: 'SWISS', type: 'grid', power: 70000, count: 10, phase: 3, cost: 2550000, savings: 40100 },
    { brand: 'SWISS', type: 'grid', power: 75000, count: 10, phase: 3, cost: 2660000, savings: 41800 },
    { brand: 'SWISS', type: 'grid', power: 77000, count: 15, phase: 3, cost: 2800000, savings: 44000 },
    { brand: 'SWISS', type: 'grid', power: 80000, count: 15, phase: 3, cost: 2910000, savings: 45800 },
    { brand: 'SWISS', type: 'grid', power: 90000, count: 15, phase: 3, cost: 3130000, savings: 49200 },
    { brand: 'SWISS', type: 'grid', power: 100000, count: 15, phase: 3, cost: 3330000, savings: 52400 },
    { brand: 'SWISS', type: 'grid', power: 105000, count: 15, phase: 3, cost: 3440000, savings: 54100 },
    { brand: 'SWISS', type: 'grid', power: 110000, count: 15, phase: 3, cost: 3660000, savings: 57500 },
    { brand: 'SWISS', type: 'grid', power: 120000, count: 15, phase: 3, cost: 3890000, savings: 61200 },
    { brand: 'SWISS', type: 'grid', power: 130000, count: 20, phase: 3, cost: 4210000, savings: 66200 },
    { brand: 'SWISS', type: 'grid', power: 135000, count: 20, phase: 3, cost: 4430000, savings: 69600 },
    { brand: 'SWISS', type: 'grid', power: 140000, count: 20, phase: 3, cost: 4540000, savings: 71400 },
    { brand: 'SWISS ?', type: 'grid', power: 150000, count: 20, phase: 3, cost: 4650000, savings: 73100 },
    { brand: 'SWISS ?', type: 'grid', power: 160000, count: 25, phase: 3, cost: 5090000, savings: 80000 },
    { brand: 'SWISS ?', type: 'grid', power: 170000, count: 25, phase: 3, cost: 5320000, savings: 83600 },
    { brand: 'SWISS ?', type: 'grid', power: 180000, count: 25, phase: 3, cost: 5650000, savings: 88800 },
    { brand: 'SWISS ?', type: 'grid', power: 190000, count: 25, phase: 3, cost: 5870000, savings: 92300 },
    { brand: 'SWISS ?', type: 'grid', power: 200000, count: 30, phase: 3, cost: 6200000, savings: 97500 },
    { brand: 'SWISS ?', type: 'grid', power: 210000, count: 30, phase: 3, cost: 6420000, savings: 101000 },
    { brand: 'SWISS ?', type: 'grid', power: 220000, count: 30, phase: 3, cost: 6750000, savings: 106200 },
    { brand: 'SWISS ?', type: 'grid', power: 230000, count: 30, phase: 3, cost: 6970000, savings: 109600 },
    { brand: 'SWISS ?', type: 'grid', power: 240000, count: 30, phase: 3, cost: 7200000, savings: 113300 },
    { brand: 'SWISS ?', type: 'grid', power: 250000, count: 40, phase: 3, cost: 7660000, savings: 120500 },
    { brand: 'SWISS ?', type: 'grid', power: 260000, count: 40, phase: 3, cost: 7770000, savings: 122200 },
    { brand: 'SWISS ?', type: 'grid', power: 270000, count: 40, phase: 3, cost: 8010000, savings: 126000 },
    { brand: 'SWISS ?', type: 'grid', power: 280000, count: 40, phase: 3, cost: 8370000, savings: 131600 },
    { brand: 'SWISS ?', type: 'grid', power: 290000, count: 40, phase: 3, cost: 8620000, savings: 135600 },
    { brand: 'SWISS ?', type: 'grid', power: 300000, count: 40, phase: 3, cost: 8970000, savings: 141100 }
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
        .filter(item => item.savings !== null)
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
            <p>На основе ваших месячных затрат <strong>${formatCurrency(monthlyCost)}</strong> мы подобрали следующие варианты:</p>
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

// Функция для обработки изменения фильтров
function handleFilterChange() {
    const brandFilter = document.getElementById('brandFilter');
    const typeFilter = document.getElementById('typeFilter');
    updateSolarTableWithFilters(brandFilter ? brandFilter.value : 'all', typeFilter ? typeFilter.value : 'all');
}

function formatInputValue(input) {
    if (input.value && input.value.trim() !== '') {
        // Сохраняем позицию курсора
        const cursorPosition = input.selectionStart;
        const valueBeforeFormat = input.value;

        input.value = formatNumber(input.value);

        // Восстанавливаем позицию курсора с учетом добавленных символов
        const addedChars = input.value.length - valueBeforeFormat.length;
        input.setSelectionRange(cursorPosition + addedChars, cursorPosition + addedChars);
    }
}


// Применяем при загрузке DOM
document.addEventListener('DOMContentLoaded', function () {
    applyNumberFormattingToAllInputs();
});