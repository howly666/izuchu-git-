/* ── Конфигурация полей для каждого режима ── */
var FIELDS_MODE1 = [
    { id: 'fa', label: 'a = ' },
    { id: 'fh', label: 'h = ' },
    { id: 'fc', label: 'c = ' },
    { id: 'fd', label: 'd = ' }
];

var FIELDS_MODE2 = [
    { id: 'fa',     label: 'a = ' },
    { id: 'fh',     label: 'h = ' },
    { id: 'falpha', label: 'α (°) = ' },
    { id: 'fbeta',  label: 'β (°) = ' }
];

/* ── Текущий режим ── */
var currentMode = 1;

/* ── Отрисовать поля ввода по режиму ── */
function renderFields(mode) {
    var fields = (mode === 1) ? FIELDS_MODE1 : FIELDS_MODE2;
    var container = document.getElementById('fields');
    container.innerHTML = '';

    for (var i = 0; i < fields.length; i++) {
        var f = fields[i];
        var p = document.createElement('p');
        p.innerHTML = '<label>' + f.label +
            '<input type="number" id="' + f.id + '" step="any">' +
            '</label>';
        container.appendChild(p);
    }

    /* навесить обработчики снятия ошибки при фокусе */
    for (var j = 0; j < fields.length; j++) {
        (function(id) {
            var el = document.getElementById(id);
            el.onfocus = function() {
                this.classList.remove('error');
            };
        })(fields[j].id);
    }

    /* снятие ошибки с "Найти" при фокусе на чекбоксах */
    var checkIds = ['chkPerimeter', 'chkSides', 'chkDiagAngle', 'chkDiagonals'];
    var findLabel = document.querySelector('.task b');
    for (var k = 0; k < checkIds.length; k++) {
        (function(cid) {
            document.getElementById(cid).onfocus = function() {
                if (findLabel) findLabel.classList.remove('find-error');
            };
        })(checkIds[k]);
    }
}

/* ── Кнопка "Показать" ── */
document.getElementById('btnShow').onclick = function() {
    var selected = document.querySelector('input[name=mode]:checked').value;
    currentMode = parseInt(selected);

    /* поменять картинку */
    var fig = document.getElementById('figure');
    fig.src = (currentMode === 1) ? 'xyi.png' : 'xyi.png';

    renderFields(currentMode);
    document.getElementById('output').innerHTML = '';
};

/* ── Получить числовое значение поля ── */
function getVal(id) {
    var el = document.getElementById(id);
    return el ? parseFloat(el.value) : NaN;
}

/* ── Пометить поле как ошибочное ── */
function markError(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('error');
}

/* ── Кнопка "Вычислить" ── */
document.getElementById('btnCalc').onclick = function() {
    var output = document.getElementById('output');
    output.innerHTML = '';

    /* проверка чекбоксов */
    var anyChecked = document.getElementById('chkPerimeter').checked ||
                     document.getElementById('chkSides').checked ||
                     document.getElementById('chkDiagAngle').checked ||
                     document.getElementById('chkDiagonals').checked;

    var findLabel = document.querySelector('.task b');
    if (!anyChecked) {
        findLabel.classList.add('find-error');
        output.innerHTML = '<p>Выберите хотя бы одну характеристику.</p>';
        return;
    }
    findLabel.classList.remove('find-error');

    /* чтение и валидация входных данных */
    var valid = true;

    var a = getVal('fa');
    if (isNaN(a) || a <= 0) { markError('fa'); valid = false; }

    var h = getVal('fh');
    if (isNaN(h) || h <= 0) { markError('fh'); valid = false; }

    var c, d, alpha, beta;

    if (currentMode === 1) {
        c = getVal('fc');
        d = getVal('fd');
        if (isNaN(c) || c <= 0) { markError('fc'); valid = false; }
        if (isNaN(d) || d <= 0) { markError('fd'); valid = false; }
        /* боковые стороны должны быть длиннее высоты */
        if (!isNaN(c) && !isNaN(h) && c <= h) { markError('fc'); valid = false; }
        if (!isNaN(d) && !isNaN(h) && d <= h) { markError('fd'); valid = false; }
    } else {
        alpha = getVal('falpha');
        beta  = getVal('fbeta');
        if (isNaN(alpha) || alpha <= 0 || alpha >= 180) { markError('falpha'); valid = false; }
        if (isNaN(beta)  || beta  <= 0 || beta  >= 180) { markError('fbeta');  valid = false; }
    }

    if (!valid) return;

    /* ── вычисления ── */
    var x1, x2, b, cSide, dSide;

    if (currentMode === 1) {
        cSide = c;
        dSide = d;
        x1 = Math.sqrt(c * c - h * h);
        x2 = Math.sqrt(d * d - h * h);
        b  = a - x1 - x2;
    } else {
        var aRad = alpha * Math.PI / 180;
        var bRad = beta  * Math.PI / 180;
        x1    = h / Math.tan(aRad);
        x2    = h / Math.tan(bRad);
        b     = a - x1 - x2;
        cSide = h / Math.sin(aRad);
        dSide = h / Math.sin(bRad);
    }

    if (b <= 0) {
        output.innerHTML = '<p>Трапеция с такими параметрами не существует (b ≤ 0).</p>';
        return;
    }

    var perimeter = a + b + cSide + dSide;

    /* диагонали: вершины BL(0,0), BR(a,0), TR(x1+b, h), TL(x1, h) */
    var diag1 = Math.sqrt((x1 + b) * (x1 + b) + h * h);
    var diag2 = Math.sqrt((a - x1) * (a - x1)  + h * h);

    /* угол между диагоналями */
    var vx1 = x1 + b, vy1 = h;
    var vx2 = x1 - a, vy2 = h;
    var cosA = (vx1 * vx2 + vy1 * vy2) / (diag1 * diag2);
    cosA = Math.max(-1, Math.min(1, cosA));
    var diagAngle = Math.acos(Math.abs(cosA)) * 180 / Math.PI;

    function fmt(v) { return parseFloat(v.toFixed(3)); }

    /* вывод результатов */
    output.innerHTML = '<p><b>Результат:</b></p>';

    if (document.getElementById('chkSides').checked) {
        var el = document.createElement('p');
        el.innerHTML = 'b = ' + fmt(b);
        output.appendChild(el);
        if (currentMode === 2) {
            var el2 = document.createElement('p');
            el2.innerHTML = 'c = ' + fmt(cSide);
            output.appendChild(el2);
            var el3 = document.createElement('p');
            el3.innerHTML = 'd = ' + fmt(dSide);
            output.appendChild(el3);
        }
    }

    if (document.getElementById('chkPerimeter').checked) {
        var elP = document.createElement('p');
        elP.innerHTML = 'P = ' + fmt(perimeter);
        output.appendChild(elP);
    }

    if (document.getElementById('chkDiagonals').checked) {
        var elD1 = document.createElement('p');
        elD1.innerHTML = 'd\u2081 = ' + fmt(diag1);
        output.appendChild(elD1);
        var elD2 = document.createElement('p');
        elD2.innerHTML = 'd\u2082 = ' + fmt(diag2);
        output.appendChild(elD2);
    }

    if (document.getElementById('chkDiagAngle').checked) {
        var elA = document.createElement('p');
        elA.innerHTML = '\u03c6 = ' + fmt(diagAngle) + '\u00b0';
        output.appendChild(elA);
    }
};

/* ── Кнопка "Очистить" ── */
document.getElementById('btnClear').onclick = function() {
    var fields = (currentMode === 1) ? FIELDS_MODE1 : FIELDS_MODE2;
    for (var i = 0; i < fields.length; i++) {
        var el = document.getElementById(fields[i].id);
        if (el) { el.value = ''; el.classList.remove('error'); }
    }

    document.getElementById('chkPerimeter').checked  = false;
    document.getElementById('chkSides').checked      = false;
    document.getElementById('chkDiagAngle').checked  = false;
    document.getElementById('chkDiagonals').checked  = false;

    var findLabel = document.querySelector('.task b');
    if (findLabel) findLabel.classList.remove('find-error');

    document.getElementById('output').innerHTML = '';
};

/* ── Первичный рендер ── */
renderFields(1);
