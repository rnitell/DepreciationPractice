(function () {
  const ITEMS_TANGIBLE = ['備品', '車両運搬具', '機械装置', '建物', '建物附属設備', '構築物'];
  const INTANGIBLES = [
    { name: '特許権', years: [8] },
    { name: '商標権', years: [10] },
    { name: 'のれん', years: [3, 4, 5, 6, 7, 8, 9, 10, 15, 20] }
  ];
  const YEARS = [3, 4, 5, 6, 8, 10];
  const RESIDUAL_10_PROB = 0.6;

  function yen(n) { return '¥' + Math.round(n).toLocaleString('ja-JP'); }

  function buildYearTableSimple(rows) {
    var html = '<div class="year-table-wrap"><table class="year-table"><tr>' +
      '<td class="yt-head">年度</td><td class="yt-head">期首帳簿価額</td><td class="yt-head">減価償却費</td><td class="yt-head">期末帳簿価額</td></tr>';
    rows.forEach(function (r, i) {
      var isCurrent = i === rows.length - 1;
      var rowClass = isCurrent ? ' class="yt-current"' : '';
      var yearLabel = (i + 1) + '年目' + (isCurrent ? '(当期)' : '');
      html += '<tr' + rowClass + '><td class="yt-label">' + yearLabel + '</td>' +
        '<td>' + yen(r.beginningBV) + '</td>' +
        '<td>' + ((r.months && r.months !== 12) ? '<span class="yt-revised-tag">(' + r.months + 'か月分)</span>' : '') + yen(r.depreciation) + '</td>' +
        '<td>' + yen(r.endingBV) + '</td></tr>';
    });
    html += '</table></div>';
    return html;
  }

  function buildMethodChangeTable(rows) {
    var html = '<div class="year-table-wrap"><table class="year-table"><tr>' +
      '<td class="yt-head">年度</td><td class="yt-head">償却方法</td><td class="yt-head">期首帳簿価額</td><td class="yt-head">減価償却費</td><td class="yt-head">期末帳簿価額</td></tr>';
    rows.forEach(function (r, i) {
      var isCurrent = i === rows.length - 1;
      var rowClass = isCurrent ? ' class="yt-current"' : '';
      var yearLabel = (i + 1) + '年目' + (isCurrent ? '(当期)' : '');
      html += '<tr' + rowClass + '><td class="yt-label">' + yearLabel + '</td>' +
        '<td class="yt-method">' + r.method + '</td>' +
        '<td>' + yen(r.beginningBV) + '</td>' +
        '<td>' + ((r.months && r.months !== 12) ? '<span class="yt-revised-tag">(' + r.months + 'か月分)</span>' : '') + yen(r.depreciation) + '</td>' +
        '<td>' + yen(r.endingBV) + '</td></tr>';
    });
    html += '</table></div>';
    return html;
  }

  function buildImpairmentDecliningTable(rows, opts) {
    opts = opts || {};
    var eventColLabel = opts.eventColLabel || '減損損失';
    var eventRowLabel = opts.eventRowLabel || '(前期末)';
    var showEventColumn = opts.showEventColumn !== false;
    var showRemainingLifeCol = !!opts.showRemainingLifeCol;
    var colCount = 4 + (showEventColumn ? 1 : 0) + (showRemainingLifeCol ? 1 : 0);
    var html = '<div class="year-table-wrap"><table class="year-table"><tr>' +
      '<td class="yt-head">年度</td>' +
      (showRemainingLifeCol ? '<td class="yt-head">残存耐用年数</td>' : '') +
      '<td class="yt-head">期首帳簿価額</td>' +
      '<td class="yt-head">減価償却費</td>' +
      (showEventColumn ? '<td class="yt-head">' + eventColLabel + '</td>' : '') +
      '<td class="yt-head">期末帳簿価額</td></tr>';
    rows.forEach(function (r, i) {
      var isCurrent = i === rows.length - 1;
      var rowClass = isCurrent ? ' class="yt-current"' : '';
      var yearLabel = (i + 1) + '年目' + (isCurrent ? '(当期)' : (r.hasImpairment ? eventRowLabel : ''));
      var impairmentCell = showEventColumn ? (r.hasImpairment ? '<td class="yt-impairment">' + (r.impairmentLoss ? yen(r.impairmentLoss) : '－') + '</td>' : '<td>－</td>') : '';
      var remainingLifeCell = showRemainingLifeCol ? '<td>' + r.remainingLife + '</td>' : '';
      var depPrefix = (r.isProrated && r.months !== 12) ? '<span class="yt-revised-tag">(' + r.months + 'か月分)</span>' : '';
      html += '<tr' + rowClass + '><td class="yt-label">' + yearLabel + '</td>' +
        remainingLifeCell +
        '<td>' + yen(r.beginningBV) + '</td>' +
        '<td>' + depPrefix + yen(r.depreciation) + '</td>' +
        impairmentCell +
        '<td>' + yen(r.endingBV) + '</td></tr>';
      if (r.hasImpairment && opts.extraRowAfterEvent) {
        html += '<tr class="yt-extra-row"><td class="yt-label" colspan="' + colCount + '">' + opts.extraRowAfterEvent + '</td></tr>';
      }
    });
    html += '</table></div>';
    return html;
  }

  function buildProductionChangeTable(rows) {
    var html = '<div class="year-table-wrap"><table class="year-table"><tr>' +
      '<td class="yt-head">年度</td><td class="yt-head">残りの利用可能量</td><td class="yt-head">期首帳簿価額</td><td class="yt-head">減価償却費</td><td class="yt-head">期末帳簿価額</td></tr>';
    rows.forEach(function (r, i) {
      var isCurrent = i === rows.length - 1;
      var rowClass = isCurrent ? ' class="yt-current"' : '';
      html += '<tr' + rowClass + '><td class="yt-label">' + r.label + '</td>' +
        '<td>' + r.remainingCapacity + '</td>' +
        '<td>' + yen(r.beginningBV) + '</td>' +
        '<td>' + yen(r.depreciation) + '</td>' +
        '<td>' + yen(r.endingBV) + '</td></tr>';
    });
    html += '</table></div>';
    return html;
  }

  function checkTableScrollHints(container) {
    if (typeof ScrollHint === 'undefined') return;
    new ScrollHint('.year-table-wrap, .group-dep-table-wrap, .soyd-table-wrap, .sw-judge-table-wrap', {
      i18n: { scrollable: 'スクロールできます' }
    });
  }

  function buildYearTableGuarantee(rows) {
    var html = '<div class="year-table-wrap"><table class="year-table"><tr>' +
      '<td class="yt-head">年度</td><td class="yt-head">期首帳簿価額</td><td class="yt-head">通常の償却額</td>' +
      '<td class="yt-head">償却保証額</td><td class="yt-head">採用額</td><td class="yt-head">期末帳簿価額</td></tr>';
    rows.forEach(function (r, i) {
      var isCurrent = i === rows.length - 1;
      var rowClass = isCurrent ? ' class="yt-current"' : '';
      var yearLabel = (i + 1) + '年目' + (isCurrent ? '(当期)' : '');
      var cls = (r.useRevised || r.isFinal) ? 'yt-adopted-revised' : 'yt-adopted-normal';
      var prefix = r.isFinal ? '<span class="yt-revised-tag">(最終)</span>' : r.useRevised ? '<span class="yt-revised-tag">(改定)</span>' : ((r.isProrated && r.months !== 12) ? '<span class="yt-revised-tag">(' + r.months + 'か月分)</span>' : '');
      html += '<tr' + rowClass + '><td class="yt-label">' + yearLabel + '</td>' +
        '<td>' + yen(r.beginningBV) + '</td>' +
        '<td>' + (r.normalDep == null ? '－' : yen(r.normalDep)) + '</td>' +
        '<td>' + (r.guaranteeAmt == null ? '－' : yen(r.guaranteeAmt)) + '</td>' +
        '<td class="' + cls + '">' + prefix + yen(r.depreciation) + '</td>' +
        '<td>' + yen(r.endingBV) + '</td></tr>';
    });
    html += '</table></div>';
    return html;
  }

  function buildGroupDepTable(assets, sumDep, sumAnnual) {
    var html = '<div class="group-dep-table-wrap"><table class="group-dep-table"><tr>' +
      '<td class="gd-head gd-name-head">資産</td>' +
      '<td class="gd-head">取得原価</td>' +
      '<td class="gd-head">残存価額</td>' +
      '<td class="gd-head">要償却額</td>' +
      '<td class="gd-head">年間償却費</td></tr>';
    assets.forEach(function (a) {
      html += '<tr><td class="gd-name">' + a.item + '</td>' +
        '<td>' + yen(a.cost) + '</td>' +
        '<td>' + (a.residual === 0 ? '0' : yen(a.residual)) + '</td>' +
        '<td>' + yen(a.dep) + '</td>' +
        '<td>' + yen(a.annual) + '</td></tr>';
    });
    html += '<tr class="gd-total"><td class="gd-name">合計</td><td></td><td></td>' +
      '<td>' + yen(sumDep) + '</td>' +
      '<td>' + yen(sumAnnual) + '</td></tr>';
    html += '</table></div>';
    return html;
  }

  function buildSumOfYearsTable(rows, T) {
    var html = '<div class="soyd-table-wrap"><table class="soyd-table"><tr>' +
      '<td class="soyd-head">年度</td>' +
      '<td class="soyd-head">項数</td>' +
      '<td class="soyd-head">月数</td>' +
      '<td class="soyd-head">期首帳簿価額</td>' +
      '<td class="soyd-head">減価償却費</td>' +
      '<td class="soyd-head">期末帳簿価額</td></tr>';
    rows.forEach(function (r) {
      var n = r.parts.length;
      var rowClass = r.isCurrent ? ' class="soyd-current"' : '';
      var yearLabel = r.year + '年目' + (r.isCurrent ? '(当期)' : '');
      r.parts.forEach(function (p, i) {
        html += '<tr' + rowClass + '>';
        if (i === 0) {
          html += '<td class="soyd-year"' + (n > 1 ? ' rowspan="' + n + '"' : '') + '>' + yearLabel + '</td>';
        }
        html += '<td class="soyd-frac">' + p.numerator + '/' + T + '</td>' +
          '<td class="soyd-frac">' + p.months + 'ヶ月</td>';
        if (i === 0) {
          html += '<td' + (n > 1 ? ' rowspan="' + n + '"' : '') + '>' + yen(r.beginningBV) + '</td>';
        }
        html += '<td>' + yen(p.dep) + '</td>';
        if (i === 0) {
          html += '<td' + (n > 1 ? ' rowspan="' + n + '"' : '') + '>' + yen(r.endingBV) + '</td>';
        }
        html += '</tr>';
      });
    });
    html += '</table></div>';
    return html;
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function lcm(a, b) { return a * b / gcd(a, b); }
  function pickResidualRate() { return Math.random() < RESIDUAL_10_PROB ? 0.1 : 0; }

  function buildCostFromDep(dep, residualRate) {
    if (residualRate === 0) return { cost: dep, residual: 0 };
    const cost = Math.round(dep * 10 / 9);
    return { cost, residual: cost - dep };
  }

  function periodFactor() {
    const trapMonths = fixedTrapMonths();
    const months = Math.random() < 0.35 ? trapMonths : randInt(1, 11);
    const multipleNeeded = 12 / gcd(12, months);
    return { months, multipleNeeded };
  }

  function scrollEasing(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function fixedTrapMonths() { return FY_START_MONTH === 4 ? 3 : 9; }
  function fixedTrapCalendarMonth() { return FY_START_MONTH === 4 ? 1 : 4; }

  function determineAcqPeriod(fyStartProb, fixedMidProb) {
    const useFYStart = Math.random() < fyStartProb;
    let months = 12, multipleNeeded = 1, useFixedMidYearDate = false;
    if (!useFYStart) {
      useFixedMidYearDate = Math.random() < fixedMidProb;
      if (useFixedMidYearDate) {
        months = fixedTrapMonths();
      } else {
        months = periodFactor().months;
      }
      multipleNeeded = 12 / gcd(12, months);
    }
    return { useFYStart, useFixedMidYearDate, months, multipleNeeded };
  }

  function residualText(residualRate) {
    return residualRate === 0 ? '残存価額はゼロ' : '残存価額は取得原価の10%';
  }

  /* ---------- fiscal year / date helpers (2パターン対応、4月始まりを優先) ---------- */
  let CURRENT_FY = randInt(11, 15);
  let FY_START_MONTH = Math.random() < 0.7 ? 4 : 1;

  function fyMonthToDate(fyStart, fyMonthIndex) {
    const calMonths = [];
    for (let i = 0; i < 12; i++) calMonths.push(((FY_START_MONTH - 1 + i) % 12) + 1);
    const month = calMonths[fyMonthIndex - 1];
    const year = month >= FY_START_MONTH ? fyStart : fyStart + 1;
    return { year, month };
  }

  function fyLabel(fyStart) {
    if (FY_START_MONTH === 1) return 'X' + fyStart + '年1月1日からX' + fyStart + '年12月31日まで';
    return 'X' + fyStart + '年4月1日からX' + (fyStart + 1) + '年3月31日まで';
  }

  function dateStr(y, m) { return 'X' + y + '年' + m + '月1日'; }
  function dateStrAnyDay(y, m) {
    const day = randInt(1, 28);
    return 'X' + y + '年' + m + '月' + day + '日';
  }
  function fyStartDateStr(fy) { const d = fyMonthToDate(fy, 1); return dateStr(d.year, d.month); }

  function pastDate(elapsedFY) {
    const fy = CURRENT_FY - elapsedFY;
    const fm = randInt(1, 12);
    const d = fyMonthToDate(fy, fm);
    return { year: d.year, month: d.month, fy };
  }

  function pastFYStart(elapsedFY) {
    const fy = CURRENT_FY - elapsedFY;
    const d = fyMonthToDate(fy, 1);
    return { year: d.year, month: d.month, fy };
  }

  function ymText(totalM) {
    const y = Math.floor(totalM / 12), m = totalM % 12;
    if (y === 0) return m + 'か月';
    if (m === 0) return y + '年';
    return y + '年' + m + 'か月';
  }

  function elapsedPeriodText(totalM) {
    return totalM < 12 ? ymText(totalM) : ymText(totalM) + '(' + totalM + 'か月)';
  }

  const NO_DECLINING_ITEMS = ['建物', '建物附属設備', '構築物'];
  const ITEMS_DECLINING_OK = ITEMS_TANGIBLE.filter(function (x) { return !NO_DECLINING_ITEMS.includes(x); });
  function pickItemFavorBihin() {
    return Math.random() < 0.5 ? '備品' : pick(ITEMS_DECLINING_OK);
  }

  const BUILDING_YEARS = [20, 22, 24, 30, 34, 38, 50];
  const STRUCTURE_YEARS = [10, 12, 15, 16, 18, 20];
  function yearsForItem(item, fallbackYears) {
    if (item === '建物') return pick(BUILDING_YEARS);
    if (item === '建物附属設備' || item === '構築物') return pick(STRUCTURE_YEARS);
    return pick(fallbackYears);
  }

  /* ---------- 3級: 定額法(年間) ---------- */
  function genStraightLine() {
    const item = pick(ITEMS_TANGIBLE);
    const years = yearsForItem(item, YEARS);
    const residualRate = pickResidualRate();
    let annualBase;
    if (item === '建物') {
      const targetLow = 1000000, targetHigh = 2000000000;
      if (residualRate === 0) {
        const low = Math.max(1, Math.ceil(targetLow / years / 100));
        const high = Math.max(low + 1, Math.floor(targetHigh / years / 100));
        annualBase = randInt(low, high);
      } else {
        const low9 = Math.max(1, Math.ceil(targetLow / years / 100 / 9));
        const high9 = Math.max(low9 + 1, Math.floor(targetHigh / years / 100 / 9));
        annualBase = 9 * randInt(low9, high9);
      }
    } else {
      annualBase = residualRate === 0 ? randInt(600, 9000) : 9 * randInt(100, 1000);
    }
    const annual = annualBase * 100;
    const dep = annual * years;
    const { cost, residual } = buildCostFromDep(dep, residualRate);
    const elapsed = randInt(0, Math.min(6, years - 1));
    let acq, useFixedMidYearDate = false;
    if (elapsed === 0) {
      acq = pastFYStart(0);
    } else {
      useFixedMidYearDate = Math.random() < 0.4;
      if (useFixedMidYearDate) {
        const fixedFyMonthIndex = FY_START_MONTH === 4 ? 10 : 4;
        const fy = CURRENT_FY - elapsed;
        const d = fyMonthToDate(fy, fixedFyMonthIndex);
        acq = { year: d.year, month: d.month, fy: fy };
      } else {
        acq = pastDate(elapsed);
      }
    }
    const acqDateStr = (elapsed === 0 || useFixedMidYearDate) ? dateStr(acq.year, acq.month) : dateStrAnyDay(acq.year, acq.month);
    return {
      level: '3', category: '定額法(年間)',
      question: acqDateStr + 'に取得した' + item + '(取得原価 ' + yen(cost) + '、' + residualText(residualRate) + '、耐用年数 ' + years + '年)を定額法により' + (elapsed === 0 ? '減価償却する' : '減価償却している') + '。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。',
      answer: annual,
      explain: fullYearNote(elapsed, acqDateStr) + straightAnnualSteps(cost, residual, years, null, annual, true)
    };
  }

  /* ---------- 3級: 定額法(償却率から) ---------- */
  const STRAIGHT_RATE_YEARS = { 4: 0.25, 5: 0.2, 8: 0.125, 10: 0.1, 20: 0.05, 25: 0.04, 40: 0.025, 50: 0.02 };
  // 償却率で出題する場合の耐用年数(資産の種類ごとに現実的な範囲から選ぶ)
  function rateYearsForItem(item) {
    if (item === '建物') return pick([20, 25, 40, 50]);
    if (item === '建物附属設備' || item === '構築物') return pick([8, 10, 20]);
    return pick([4, 5, 8, 10]);
  }
  // 定額法の年間減価償却費:項目名の行と計算式の行(残存価額ゼロのときは「− ¥0」を表示しない)
  function straightAnnualSteps(cost, residual, years, rate, annual, emphasize) {
    const cls = emphasize ? 'step formula' : 'step';
    if (rate) {
      return residual === 0
        ? '<div class="step">年間の減価償却費 = 取得原価 × 償却率</div><div class="' + cls + '">' + yen(cost) + ' × ' + rate + ' = ' + yen(annual) + '</div>'
        : '<div class="step">年間の減価償却費 = (取得原価 − 残存価額) × 償却率</div><div class="' + cls + '">(' + yen(cost) + ' − ' + yen(residual) + ') × ' + rate + ' = ' + yen(annual) + '</div>';
    }
    return residual === 0
      ? '<div class="step">年間の減価償却費 = 取得原価 ÷ 耐用年数</div><div class="' + cls + '">' + yen(cost) + ' ÷ ' + years + ' = ' + yen(annual) + '</div>'
      : '<div class="step">年間の減価償却費 = (取得原価 − 残存価額) ÷ 耐用年数</div><div class="' + cls + '">(' + yen(cost) + ' − ' + yen(residual) + ') ÷ ' + years + ' = ' + yen(annual) + '</div>';
  }
  // 「年間」の問題の冒頭の補足
  function fullYearNote(elapsed, acqDateStr) {
    return elapsed === 0
      ? '<div class="step">当期首(' + acqDateStr + ')に取得しているため、当期は1年分の減価償却費を計上する</div>'
      : '<div class="step">取得日(' + acqDateStr + ')は前期以前のため、当期は1年分の減価償却費を計上する</div>';
  }
  function genStraightLineByRate() {
    const item = pick(ITEMS_TANGIBLE);
    const years = rateYearsForItem(item);
    const rate = STRAIGHT_RATE_YEARS[years];
    const residualRate = pickResidualRate();
    let annualBase;
    if (item === '建物') {
      const targetLow = 1000000, targetHigh = 2000000000;
      if (residualRate === 0) {
        const low = Math.max(1, Math.ceil(targetLow / years / 100));
        const high = Math.max(low + 1, Math.floor(targetHigh / years / 100));
        annualBase = randInt(low, high);
      } else {
        const low9 = Math.max(1, Math.ceil(targetLow / years / 100 / 9));
        const high9 = Math.max(low9 + 1, Math.floor(targetHigh / years / 100 / 9));
        annualBase = 9 * randInt(low9, high9);
      }
    } else {
      annualBase = residualRate === 0 ? randInt(600, 9000) : 9 * randInt(100, 1000);
    }
    const annual = annualBase * 100;
    const dep = annual * years;
    const { cost, residual } = buildCostFromDep(dep, residualRate);
    const elapsed = randInt(0, Math.min(6, years - 1));
    const acq = elapsed === 0 ? pastFYStart(0) : pastDate(elapsed);
    const acqDateStr = elapsed === 0 ? dateStr(acq.year, acq.month) : dateStrAnyDay(acq.year, acq.month);
    return {
      level: '2', category: '定額法(償却率から)',
      question: acqDateStr + 'に取得した' + item + '(取得原価 ' + yen(cost) + '、' + residualText(residualRate) + '、償却率 ' + rate + ')を定額法により' + (elapsed === 0 ? '減価償却する' : '減価償却している') + '。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。',
      answer: annual,
      explain: fullYearNote(elapsed, acqDateStr) + straightAnnualSteps(cost, residual, years, rate, annual, true)
    };
  }

  /* ---------- 2級: 定額法(償却率・月割) ---------- */
  function genPeriodStraightLineByRate() {
    const item = pick(ITEMS_TANGIBLE);
    const years = rateYearsForItem(item);
    const rate = STRAIGHT_RATE_YEARS[years];
    const useFixedMidYearDate = Math.random() < 0.4;
    const { months, multipleNeeded } = useFixedMidYearDate
      ? (function () { const m = fixedTrapMonths(); return { months: m, multipleNeeded: 12 / gcd(12, m) }; })()
      : periodFactor();
    const residualRate = pickResidualRate();
    const factor = residualRate === 0 ? multipleNeeded : lcm(multipleNeeded, 9);
    let annualBase;
    if (item === '建物') {
      const targetLow = 1000000, targetHigh = 2000000000;
      const lo = Math.max(1, Math.ceil(targetLow / years / 100 / factor));
      const hi = Math.max(lo, Math.floor(targetHigh / years / 100 / factor));
      annualBase = factor * randInt(lo, hi);
    } else {
      const loBase = Math.max(100, Math.ceil(120000 / years / 100 / factor));
      annualBase = factor * randInt(loBase, Math.max(loBase + 100, 800));
    }
    const annual = annualBase * 100;
    const dep = annual * years;
    const { cost, residual } = buildCostFromDep(dep, residualRate);
    const period = Math.round(annual * months / 12);
    const fyMonth = 13 - months;
    const d = fyMonthToDate(CURRENT_FY, fyMonth);
    return {
      level: '2', category: '定額法(償却率・月割)',
      question: (useFixedMidYearDate ? dateStr(d.year, d.month) : dateStrAnyDay(d.year, d.month)) + 'に取得した' + item + '(取得原価 ' + yen(cost) + '、' + residualText(residualRate) + '、償却率 ' + rate + ')について、定額法により減価償却する。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。',
      answer: period,
      explain: '<div class="step">取得日から当期末までの使用月数は' + months + 'か月なので月割計算する</div>' +
        straightAnnualSteps(cost, residual, years, rate, annual, false) +
        '<div class="step formula">当期分 = ' + yen(annual) + ' × ' + months + ' ÷ 12 = ' + yen(period) + '</div>'
    };
  }

  /* ---------- 3級: 定額法(月割) ---------- */
  function genPeriodStraightLine() {
    const item = pick(ITEMS_TANGIBLE);
    const years = yearsForItem(item, YEARS);
    const useFixedMidYearDate = Math.random() < 0.4;
    const { months, multipleNeeded } = useFixedMidYearDate
      ? (function () { const m = fixedTrapMonths(); return { months: m, multipleNeeded: 12 / gcd(12, m) }; })()
      : periodFactor();
    const residualRate = pickResidualRate();
    const factor = residualRate === 0 ? multipleNeeded : lcm(multipleNeeded, 9);
    let annualBase;
    if (item === '建物') {
      const targetLow = 1000000, targetHigh = 2000000000;
      const lo = Math.max(1, Math.ceil(targetLow / years / 100 / factor));
      const hi = Math.max(lo, Math.floor(targetHigh / years / 100 / factor));
      annualBase = factor * randInt(lo, hi);
    } else {
      const loBase = Math.max(100, Math.ceil(120000 / years / 100 / factor));
      annualBase = factor * randInt(loBase, Math.max(loBase + 100, 800));
    }
    const annual = annualBase * 100;
    const dep = annual * years;
    const { cost, residual } = buildCostFromDep(dep, residualRate);
    const period = Math.round(annual * months / 12);
    const fyMonth = 13 - months;
    const d = fyMonthToDate(CURRENT_FY, fyMonth);
    return {
      level: '3', category: '定額法(月割)',
      question: (useFixedMidYearDate ? dateStr(d.year, d.month) : dateStrAnyDay(d.year, d.month)) + 'に取得した' + item + '(取得原価 ' + yen(cost) + '、' + residualText(residualRate) + '、耐用年数 ' + years + '年)について、定額法により減価償却する。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。',
      answer: period,
      explain: '<div class="step">取得日から当期末までの使用月数は' + months + 'か月なので月割計算する</div>' +
        straightAnnualSteps(cost, residual, years, null, annual, false) +
        '<div class="step formula">当期分 = ' + yen(annual) + ' × ' + months + ' ÷ 12 = ' + yen(period) + '</div>'
    };
  }

  /* ---------- 2級: 定率法(期首帳簿価額から) ---------- */
  // 200%定率法の保証率・改定償却率(減価償却資産の償却率表の値)
  function fakeGuaranteeFigures(rate, years) {
    const TABLE = { 4: { guaranteeRate: 0.12499, revisedRate: '1.000' }, 5: { guaranteeRate: 0.108, revisedRate: 0.5 }, 8: { guaranteeRate: 0.07909, revisedRate: 0.334 }, 10: { guaranteeRate: 0.06552, revisedRate: 0.25 } };
    return TABLE[years];
  }

  function declineChain(rate, e) {
    const oneMinusFrac = { 0.5: [1, 2], 0.4: [3, 5], 0.25: [3, 4], 0.2: [4, 5] };
    const rateFrac = { 0.5: [1, 2], 0.4: [2, 5], 0.25: [1, 4], 0.2: [1, 5] };
    const [oNumer, oDenom] = oneMinusFrac[rate];
    const [rNumer, rDenom] = rateFrac[rate];
    const scale = Math.pow(oDenom, e);
    const mMin = Math.max(200, Math.ceil(1000 / scale));
    const m = randInt(mMin, Math.max(mMin + 100, 1200));
    const cost = scale * m * 100;
    const bookValueAfterE = Math.pow(oNumer, e) * m * 100;
    const answer = bookValueAfterE * rNumer / rDenom;
    return { cost, bookValueAfterE, answer };
  }

  function declineChainProrated(rate, e, monthsInFirstYear) {
    const oneMinusFrac = { 0.5: [1, 2], 0.4: [3, 5], 0.25: [3, 4], 0.2: [4, 5] };
    const rateFrac = { 0.5: [1, 2], 0.4: [2, 5], 0.25: [1, 4], 0.2: [1, 5] };
    const [oNumer, oDenom] = oneMinusFrac[rate];
    const [rNumer, rDenom] = rateFrac[rate];
    const fullYearsAfterFirst = e - 1;
    const P1_denom = rDenom * 12;
    const D = P1_denom * Math.pow(oDenom, fullYearsAfterFirst) * rDenom;
    const kMin = Math.max(100, Math.ceil(1000 / D));
    const k = randInt(kMin, Math.max(kMin + 100, 600));
    const cost = D * k * 100;
    const dep1 = cost * rNumer * monthsInFirstYear / P1_denom;
    let bv = cost - dep1;
    const steps = [{ label: '初年度末帳簿価額(' + monthsInFirstYear + 'か月分・月割)', from: cost, to: bv, isFirst: true }];
    for (let y = 0; y < fullYearsAfterFirst; y++) {
      const nb = bv * oNumer / oDenom;
      steps.push({ label: (y + 2) + '年目末帳簿価額', from: bv, to: nb, isFirst: false });
      bv = nb;
    }
    const bookValueAfterE = bv;
    const answer = bookValueAfterE * rNumer / rDenom;
    steps.push({ label: '当期末帳簿価額', from: bookValueAfterE, to: bookValueAfterE - answer, isFirst: false, isCurrent: true });
    return { cost, bookValueAfterE, answer, steps };
  }

  function genDecliningSimple() {
    const item = pickItemFavorBihin();
    const DECL = { 4: 0.5, 5: 0.4, 8: 0.25, 10: 0.2 };
    const years = pick(Object.keys(DECL).map(Number));
    const rate = DECL[years];
    const e = randInt(0, 2);
    const residualRate = pickResidualRate();
    const fake = fakeGuaranteeFigures(rate, years);
    const useFYStart = Math.random() < 0.4;
    const rateFracMap = { 0.5: [1, 2], 0.4: [2, 5], 0.25: [1, 4], 0.2: [1, 5] };

    let cost, bookValueAfterE, answer, acqDateStr, steps, months;
    if (e === 0) {
      const [rNumer, rDenom] = rateFracMap[rate];
      if (useFYStart) {
        const mMin = Math.max(200, Math.ceil(1000 / rDenom));
        const m = randInt(mMin, Math.max(mMin + 100, 1200));
        cost = rDenom * m * 100;
        bookValueAfterE = cost;
        answer = cost * rNumer / rDenom;
        const acq = pastFYStart(0);
        acqDateStr = dateStr(acq.year, acq.month);
        steps = '';
      } else {
        const useFixedMidYearDate = Math.random() < 0.5;
        const midYearMonth = fixedTrapCalendarMonth();
        let acqYear, acqMonth, currentPeriodMonths;
        if (useFixedMidYearDate) {
          const d = fyMonthToDate(CURRENT_FY, ((midYearMonth - FY_START_MONTH + 12) % 12) + 1);
          acqYear = d.year; acqMonth = d.month;
        } else {
          const gap = randInt(1, 11);
          const d = fyMonthToDate(CURRENT_FY, (gap % 12) + 1);
          acqYear = d.year; acqMonth = d.month;
        }
        currentPeriodMonths = 13 - ((((acqMonth - FY_START_MONTH + 12) % 12)) + 1);
        acqDateStr = useFixedMidYearDate ? dateStr(acqYear, acqMonth) : dateStrAnyDay(acqYear, acqMonth);
        const monthMult = 12 / gcd(12, currentPeriodMonths);
        const D = rDenom * monthMult;
        const kMin = Math.max(100, Math.ceil(1000 / D));
        const k = randInt(kMin, Math.max(kMin + 100, 600));
        cost = D * k * 100;
        bookValueAfterE = cost;
        const annualFull = cost * rNumer / rDenom;
        answer = Math.round(annualFull * currentPeriodMonths / 12);
        steps = '<div class="step" style="margin-top:16px;">取得日から当期末までの使用月数は' + currentPeriodMonths + 'か月なので月割計算する</div>' +
          '<div class="step">年間の減価償却費 = 取得原価 × 償却率</div>' +
          '<div class="step">' + yen(cost) + ' × ' + rate + ' = ' + yen(annualFull) + '</div>' +
          '<div class="step formula">当期分 = ' + yen(annualFull) + ' × ' + currentPeriodMonths + ' ÷ 12 = ' + yen(answer) + '</div>';
      }
    } else if (useFYStart) {
      const chain = declineChain(rate, e);
      cost = chain.cost; bookValueAfterE = chain.bookValueAfterE; answer = chain.answer;
      const acq = pastFYStart(e);
      acqDateStr = dateStr(acq.year, acq.month);
      const tableRows = [];
      let bv = cost;
      for (let y = 1; y <= e + 1; y++) {
        const newBv = Math.round(bv * (1 - rate));
        tableRows.push({ beginningBV: bv, depreciation: bv - newBv, endingBV: newBv });
        bv = newBv;
      }
      steps = buildYearTableSimple(tableRows);
    } else {
      const useFixedMidYearDate2 = Math.random() < 0.4;
      months = useFixedMidYearDate2 ? (fixedTrapMonths()) : periodFactor().months;
      const chain = declineChainProrated(rate, e, months);
      cost = chain.cost; bookValueAfterE = chain.bookValueAfterE; answer = chain.answer;
      const fyStart = fyMonthToDate(CURRENT_FY, 1);
      const fyStartAbs = fyStart.year * 12 + (fyStart.month - 1);
      const acqAbs = fyStartAbs - ((e - 1) * 12 + months);
      const acqYear = Math.floor(acqAbs / 12);
      const acqMonth = acqAbs - acqYear * 12 + 1;
      acqDateStr = useFixedMidYearDate2 ? dateStr(acqYear, acqMonth) : dateStrAnyDay(acqYear, acqMonth);
      const tableRows = chain.steps.map(function (s, idx) { return { beginningBV: s.from, depreciation: s.from - s.to, endingBV: s.to, months: idx === 0 ? months : undefined }; });
      steps = buildYearTableSimple(tableRows);
    }

    if (e === 0) {
      return {
        level: '2', category: '定率法(200%・取得年月から算定)',
        question: acqDateStr + '取得の' + item + '(取得原価 ' + yen(cost) + '、' + residualText(residualRate) + '、耐用年数 ' + years + '年、定率法・償却率 ' + rate + '、保証率 ' + fake.guaranteeRate + '、改定償却率 ' + fake.revisedRate + ')により減価償却する。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費はいくらか。',
        answer,
        explain: '<div class="step">定率法では残存価額は計算に使用しない</div>' +
          '<div class="step">取得初年度は、通常の償却額が償却保証額を下回ることはないため、保証率・改定償却率は使用しない</div>' +
          steps +
          (useFYStart ? '<div class="step">当期の減価償却費 = 取得原価 × 償却率</div><div class="step formula">' + yen(cost) + ' × ' + rate + ' = ' + yen(answer) + '</div>' : '')
      };
    }

    return {
      level: '2', category: '定率法(200%・取得年月から算定)',
      question: acqDateStr + '取得の' + item + '(取得原価 ' + yen(cost) + '、' + residualText(residualRate) + '、耐用年数 ' + years + '年、定率法・償却率 ' + rate + '、保証率 ' + fake.guaranteeRate + '、改定償却率 ' + fake.revisedRate + ')により減価償却している。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費はいくらか。',
      answer,
      explain: '<div class="step">定率法では残存価額は使用せず、取得日から当期首までの期間をもとに期首帳簿価額を計算する' + (useFYStart ? '' : '(初年度' + months + 'か月分は月割計算)') + '</div>' +
        steps +
        '<div class="step">通常の償却額 = 期首帳簿価額 × 償却率 = ' + yen(bookValueAfterE) + ' × ' + rate + ' = ' + yen(answer) + '</div>' +
        '<div class="step">償却保証額 = 取得原価 × 保証率 = ' + yen(cost) + ' × ' + fake.guaranteeRate + ' = ' + yen(Math.round(cost * fake.guaranteeRate)) + '</div>' +
        '<div class="step" style="margin-top:16px;">通常の償却額(' + yen(answer) + ')が償却保証額(' + yen(Math.round(cost * fake.guaranteeRate)) + ')を上回っているため、保証率・改定償却率は使用しない</div>' +
        '<div class="step formula">当期の減価償却費 = ' + yen(answer) + '</div>'
    };
  }

  /* ---------- 2級: 定率法(償却率を自分で求める) ---------- */
  function genDecliningDeriveRate() {
    const item = pickItemFavorBihin();
    const DECL = { 4: 0.5, 5: 0.4, 8: 0.25, 10: 0.2 };
    const years = pick(Object.keys(DECL).map(Number));
    const rate = DECL[years];
    const fake = fakeGuaranteeFigures(rate, years);
    const e = randInt(0, 2);
    const residualRate = pickResidualRate();
    const useFYStart = Math.random() < 0.4;
    const rateFracMap2 = { 0.5: [1, 2], 0.4: [2, 5], 0.25: [1, 4], 0.2: [1, 5] };

    let cost, bookValueAfterE, answer, acqDateStr, steps, months;
    if (e === 0) {
      const [rNumer, rDenom] = rateFracMap2[rate];
      if (useFYStart) {
        const mMin = Math.max(200, Math.ceil(1000 / rDenom));
        const m = randInt(mMin, Math.max(mMin + 100, 1200));
        cost = rDenom * m * 100;
        bookValueAfterE = cost;
        answer = cost * rNumer / rDenom;
        const acq = pastFYStart(0);
        acqDateStr = dateStr(acq.year, acq.month);
        steps = '';
      } else {
        const useFixedMidYearDate = Math.random() < 0.5;
        const midYearMonth = fixedTrapCalendarMonth();
        let acqYear, acqMonth, currentPeriodMonths;
        if (useFixedMidYearDate) {
          const d = fyMonthToDate(CURRENT_FY, ((midYearMonth - FY_START_MONTH + 12) % 12) + 1);
          acqYear = d.year; acqMonth = d.month;
        } else {
          const gap = randInt(1, 11);
          const d = fyMonthToDate(CURRENT_FY, (gap % 12) + 1);
          acqYear = d.year; acqMonth = d.month;
        }
        currentPeriodMonths = 13 - ((((acqMonth - FY_START_MONTH + 12) % 12)) + 1);
        acqDateStr = useFixedMidYearDate ? dateStr(acqYear, acqMonth) : dateStrAnyDay(acqYear, acqMonth);
        const monthMult = 12 / gcd(12, currentPeriodMonths);
        const D = rDenom * monthMult;
        const kMin = Math.max(100, Math.ceil(1000 / D));
        const k = randInt(kMin, Math.max(kMin + 100, 600));
        cost = D * k * 100;
        bookValueAfterE = cost;
        const annualFull = cost * rNumer / rDenom;
        answer = Math.round(annualFull * currentPeriodMonths / 12);
        steps = '<div class="step" style="margin-top:16px;">取得日から当期末までの使用月数は' + currentPeriodMonths + 'か月なので月割計算する</div>' +
          '<div class="step">年間の減価償却費 = 取得原価 × 償却率</div>' +
          '<div class="step">' + yen(cost) + ' × ' + rate + ' = ' + yen(annualFull) + '</div>' +
          '<div class="step formula">当期分 = ' + yen(annualFull) + ' × ' + currentPeriodMonths + ' ÷ 12 = ' + yen(answer) + '</div>';
      }
    } else if (useFYStart) {
      const chain = declineChain(rate, e);
      cost = chain.cost; bookValueAfterE = chain.bookValueAfterE; answer = chain.answer;
      const acq = pastFYStart(e);
      acqDateStr = dateStr(acq.year, acq.month);
      const tableRows = [];
      let bv = cost;
      for (let y = 1; y <= e + 1; y++) {
        const newBv = Math.round(bv * (1 - rate));
        tableRows.push({ beginningBV: bv, depreciation: bv - newBv, endingBV: newBv });
        bv = newBv;
      }
      steps = buildYearTableSimple(tableRows);
    } else {
      const useFixedMidYearDate2 = Math.random() < 0.4;
      months = useFixedMidYearDate2 ? (fixedTrapMonths()) : periodFactor().months;
      const chain = declineChainProrated(rate, e, months);
      cost = chain.cost; bookValueAfterE = chain.bookValueAfterE; answer = chain.answer;
      const fyStart = fyMonthToDate(CURRENT_FY, 1);
      const fyStartAbs = fyStart.year * 12 + (fyStart.month - 1);
      const acqAbs = fyStartAbs - ((e - 1) * 12 + months);
      const acqYear = Math.floor(acqAbs / 12);
      const acqMonth = acqAbs - acqYear * 12 + 1;
      acqDateStr = useFixedMidYearDate2 ? dateStr(acqYear, acqMonth) : dateStrAnyDay(acqYear, acqMonth);
      const tableRows = chain.steps.map(function (s, idx) { return { beginningBV: s.from, depreciation: s.from - s.to, endingBV: s.to, months: idx === 0 ? months : undefined }; });
      steps = buildYearTableSimple(tableRows);
    }

    if (e === 0) {
      return {
        level: '2', category: '定率法(200%定率法・償却率は自分で算定)',
        question: acqDateStr + '取得の' + item + '(取得原価 ' + yen(cost) + '、' + residualText(residualRate) + '、耐用年数 ' + years + '年、保証率 ' + fake.guaranteeRate + '、改定償却率 ' + fake.revisedRate + ')について、200%定率法により減価償却する。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費はいくらか。',
        answer,
        explain: '<div class="step">200%定率法の償却率 = 1 ÷ 耐用年数' + years + '年 × 200% = ' + rate + '</div>' +
          '<div class="step">定率法では残存価額は計算に使用しない</div>' +
          '<div class="step">取得初年度は、通常の償却額が償却保証額を下回ることはないため、保証率・改定償却率は使用しない</div>' +
          steps +
          (useFYStart ? '<div class="step">当期の減価償却費 = 取得原価 × 償却率</div><div class="step formula">' + yen(cost) + ' × ' + rate + ' = ' + yen(answer) + '</div>' : '')
      };
    }

    return {
      level: '2', category: '定率法(200%定率法・償却率は自分で算定)',
      question: acqDateStr + '取得の' + item + '(取得原価 ' + yen(cost) + '、' + residualText(residualRate) + '、耐用年数 ' + years + '年、保証率 ' + fake.guaranteeRate + '、改定償却率 ' + fake.revisedRate + ')について、200%定率法により減価償却している。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費はいくらか。',
      answer,
      explain: '<div class="step">200%定率法の償却率 = 1 ÷ 耐用年数' + years + '年 × 200% = ' + rate + '</div>' +
        '<div class="step">定率法では残存価額は使用せず、取得日から当期首までの期間をもとに期首帳簿価額を計算する' + (useFYStart ? '' : '(初年度' + months + 'か月分は月割計算)') + '</div>' +
        steps +
        '<div class="step">通常の償却額 = 期首帳簿価額 × 償却率 = ' + yen(bookValueAfterE) + ' × ' + rate + ' = ' + yen(answer) + '</div>' +
        '<div class="step">償却保証額 = 取得原価 × 保証率 = ' + yen(cost) + ' × ' + fake.guaranteeRate + ' = ' + yen(Math.round(cost * fake.guaranteeRate)) + '</div>' +
        '<div class="step" style="margin-top:16px;">通常の償却額(' + yen(answer) + ')が償却保証額(' + yen(Math.round(cost * fake.guaranteeRate)) + ')を上回っているため、保証率・改定償却率は使用しない</div>' +
        '<div class="step formula">当期の減価償却費 = ' + yen(answer) + '</div>'
    };
  }

  /* ---------- 2級: 定率法(保証率・改定償却率、期首帳簿価額は自分で算定) ---------- */
  const GUARANTEE = {
    5: { rate: 0.400, revisedRate: 0.500, guaranteeRate: 0.10800 },
    9: { rate: 0.222, revisedRate: 0.250, guaranteeRate: 0.07126 }
  };
  const GUARANTEE_SWITCH_E = { 5: 3, 9: 5 };
  function genDecliningGuarantee() {
    const item = pickItemFavorBihin();
    const years = pick([5, 9]);
    const e = GUARANTEE_SWITCH_E[years];
    const residualRate = pickResidualRate();
    const useDeriveRate = Math.random() < 0.5;
    const useCeil = years === 9 && useDeriveRate && Math.random() < 0.5;
    const rate = (years === 9 && useCeil) ? 0.223 : GUARANTEE[years].rate;
    const guaranteeRate = GUARANTEE[years].guaranteeRate;
    const revisedRate = GUARANTEE[years].revisedRate;
    const roundingLabel = useCeil ? '切り上げ' : '四捨五入';

    const useFYStart = Math.random() < 0.7;
    const useSecondRevised = useFYStart && years === 9 && Math.random() < 0.5;
    let cost, months, eActual = e, useFixedMidYearDate = false;
    if (useFYStart) {
      const costBase = randInt(3000, 900000);
      cost = costBase * 100;
      if (useSecondRevised) eActual = e + 1;
    } else {
      useFixedMidYearDate = Math.random() < 0.5;
      if (useFixedMidYearDate) {
        if (FY_START_MONTH === 4) {
          months = 3;
          eActual = e + 1;
        } else {
          months = 9;
          eActual = e;
        }
      } else {
        months = randInt(9, 11);
        eActual = e;
      }
      const monthMult = 12 / gcd(12, months);
      const kMult = monthMult * randInt(300, 90000);
      cost = kMult * 100;
    }

    let bv = cost;
    const tableRowsG = [];
    const guaranteeAmount = Math.round(cost * guaranteeRate);
    let switchCost = null, switchYear = null;
    for (let y = 1; y <= eActual; y++) {
      let newBv;
      if (useSecondRevised) {
        const normalY = Math.round(bv * rate);
        if (switchCost === null && normalY < guaranteeAmount) { switchCost = bv; switchYear = y; }
        const depY = switchCost !== null ? Math.round(switchCost * revisedRate) : normalY;
        newBv = bv - depY;
        tableRowsG.push({ beginningBV: bv, normalDep: normalY, guaranteeAmt: y === switchYear ? guaranteeAmount : null, depreciation: depY, endingBV: newBv, useRevised: switchCost !== null });
      } else if (y === 1 && !useFYStart) {
        const dep1 = Math.round(cost * rate * months / 12);
        newBv = cost - dep1;
        tableRowsG.push({ beginningBV: bv, normalDep: dep1, guaranteeAmt: null, depreciation: dep1, endingBV: newBv, useRevised: false, isProrated: true, months: months });
      } else {
        newBv = bv - Math.round(bv * rate);
        tableRowsG.push({ beginningBV: bv, normalDep: bv - newBv, guaranteeAmt: null, depreciation: bv - newBv, endingBV: newBv, useRevised: false });
      }
      bv = newBv;
    }
    const currentBV = bv;
    const alreadySwitched = switchCost !== null;
    const revisedCost = alreadySwitched ? switchCost : bv;
    const normalAmount = Math.round(currentBV * rate);
    const revisedAmount = Math.round(revisedCost * revisedRate);
    const useRevisedFinal = alreadySwitched || normalAmount < guaranteeAmount;
    const answer = useRevisedFinal ? revisedAmount : normalAmount;
    const finalDepreciation = answer;
    tableRowsG.push({ beginningBV: currentBV, normalDep: normalAmount, guaranteeAmt: guaranteeAmount, depreciation: finalDepreciation, endingBV: currentBV - finalDepreciation, useRevised: useRevisedFinal });
    const steps = buildYearTableGuarantee(tableRowsG);

    let acq, acqDateStr;
    if (useFYStart) {
      acq = pastFYStart(eActual);
      acqDateStr = dateStr(acq.year, acq.month);
    } else {
      const fyStart = fyMonthToDate(CURRENT_FY - eActual + 1, 1);
      const fyStartAbs = fyStart.year * 12 + (fyStart.month - 1);
      const acqAbs = fyStartAbs - months;
      const acqYear = Math.floor(acqAbs / 12);
      const acqMonth = acqAbs - acqYear * 12 + 1;
      acq = { year: acqYear, month: acqMonth, fy: CURRENT_FY - eActual };
      acqDateStr = useFixedMidYearDate ? dateStr(acqYear, acqMonth) : dateStrAnyDay(acqYear, acqMonth);
    }

    const rateRoundingClause = (years === 9 && useDeriveRate) ? '(償却率は小数点以下第4位を' + roundingLabel + ')' : '';
    const proratedNote = '';

    return {
      level: '2', category: '定率法(保証率・改定償却率)',
      question: acqDateStr + '取得の' + item + '(取得原価 ' + yen(cost) + '、' + residualText(residualRate) + '、耐用年数 ' + years + '年' + (useDeriveRate ? '' : '、定率法・償却率 ' + rate + '') + '、保証率 ' + guaranteeRate + '、改定償却率 ' + revisedRate + ')について、' + (useDeriveRate ? '200%定率法' + rateRoundingClause + 'により減価償却している' : '減価償却している') + '。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい(計算の過程で端数が生じる場合は円未満四捨五入)。',
      answer,
      explain: (useDeriveRate ? '<div class="step">200%定率法の償却率 = 1 ÷ 耐用年数' + years + '年 × 200% = ' + rate + (years === 9 ? '(小数点以下第4位を' + roundingLabel + ')' : '') + '</div>' : '') +
        '<div class="step">定率法では残存価額は使用せず、取得日から当期首までの期間をもとに期首帳簿価額を計算する' + (useFYStart ? '' : '(初年度' + months + 'か月分は月割計算)') + '</div>' +
        proratedNote +
        steps +
        (alreadySwitched
          ? '<div class="step">' + switchYear + '年目に通常の償却額が償却保証額(' + yen(guaranteeAmount) + ')を下回ったため、' + switchYear + '年目から改定償却率に切り替わっている</div>' +
            '<div class="step">改定取得価額 = 改定償却率に切り替わった年度(' + switchYear + '年目)の期首帳簿価額 = ' + yen(revisedCost) + '</div>' +
            '<div class="step" style="margin-top:16px;">' + (eActual + 1) + '年目も、当期首の帳簿価額ではなく改定取得価額に改定償却率を掛けて計算する</div>' +
            '<div class="step">当期の減価償却費 = 改定取得価額 × 改定償却率</div>' +
            '<div class="step formula">' + yen(revisedCost) + ' × ' + revisedRate + ' = ' + yen(answer) + '</div>'
          : '<div class="step">通常の償却額 = 期首帳簿価額 × 償却率 = ' + yen(currentBV) + ' × ' + rate + ' = ' + yen(normalAmount) + '</div>' +
        '<div class="step">償却保証額 = 取得原価 × 保証率 = ' + yen(cost) + ' × ' + guaranteeRate + ' = ' + yen(guaranteeAmount) + '</div>' +
        '<div class="step" style="margin-top:16px;">' + (eActual + 1) + '年目は、通常の償却額(' + yen(normalAmount) + ')が償却保証額(' + yen(guaranteeAmount) + ')を' + (useRevisedFinal ? '下回るため、改定取得価額 × 改定償却率' : '上回るため、通常の計算式') + 'で当期の減価償却費を求める</div>' +
        (useRevisedFinal
          ? '<div class="step">改定取得価額 = 当期首の帳簿価額 = ' + yen(revisedCost) + '</div>' +
            '<div class="step">当期の減価償却費 = 改定取得価額 × 改定償却率</div>' +
            '<div class="step formula">' + yen(revisedCost) + ' × ' + revisedRate + ' = ' + yen(answer) + '</div>'
          : '<div class="step formula">当期の減価償却費 = ' + yen(answer) + '</div>'))
    };
  }

  /* ---------- 3級・2級: 定額法(償却最終年度・備忘価額) ---------- */
  function genStraightLineFinalYear() { return genStraightLineFinalYearCore('2'); }
  function genStraightLineFinalYear3() { return genStraightLineFinalYearCore('3'); }
  function genStraightLineFinalYearCore(level) {
    const item = pick(['備品', '車両運搬具', '機械装置']);
    const years = pick([3, 4, 5, 6, 8, 10]);
    const useRate = level === '2' && STRAIGHT_RATE_YEARS[years] !== undefined && Math.random() < 0.4;
    const rate = useRate ? STRAIGHT_RATE_YEARS[years] : null;
    // 残存価額10%のパターン(備忘価額なし・常に最終年度) / 残存価額ゼロ・備忘価額1円のパターン
    const useTenPercent = Math.random() < 0.4;
    const isFinal = useTenPercent ? true : Math.random() < 0.6;
    const useFYStart = useTenPercent ? Math.random() < 0.25 : Math.random() < 0.4;
    const lastMonths = useFYStart ? 12 : randInt(1, 11);
    const firstMonths = useFYStart ? 12 : 12 - lastMonths;
    const mult = 12 / gcd(12, lastMonths);
    let annual, cost, residual;
    if (useTenPercent) {
      // 年間償却費 = 取得原価 × 90% ÷ 耐用年数 が円単位で割り切れるよう、取得原価を組み立てる
      const k = mult * randInt(Math.ceil(70 / mult), Math.floor(1000 / mult));
      annual = 900 * k;
      cost = 1000 * k * years;
      residual = 100 * k * years;
    } else {
      annual = mult * randInt(Math.ceil(600 / mult), Math.floor(9000 / mult)) * 100;
      cost = annual * years;
      residual = 0;
    }
    const e = useFYStart ? (isFinal ? years - 1 : years - 2) : (isFinal ? years : years - 1);
    let acqDateStr;
    if (useFYStart) {
      const acq = pastFYStart(e);
      acqDateStr = dateStr(acq.year, acq.month);
    } else {
      const d = fyMonthToDate(CURRENT_FY - e, lastMonths + 1);
      acqDateStr = Math.random() < 0.6 ? dateStrAnyDay(d.year, d.month) : dateStr(d.year, d.month);
    }
    const usedMonths = useFYStart ? 12 * e : firstMonths + 12 * (e - 1);
    const remainingMonths = 12 * years - usedMonths;
    const bookValueStart = cost - annual * usedMonths / 12;
    let answer;
    if (useTenPercent) answer = annual * lastMonths / 12;
    else answer = isFinal ? bookValueStart - 1 : annual;

    const annualStep = useTenPercent
      ? (useRate
        ? '<div class="step">年間の減価償却費 = (取得原価 − 残存価額) × 償却率</div>' +
          '<div class="step">(' + yen(cost) + ' − ' + yen(residual) + ') × ' + rate + ' = ' + yen(annual) + '</div>'
        : '<div class="step">年間の減価償却費 = (取得原価 − 残存価額) ÷ 耐用年数</div>' +
          '<div class="step">(' + yen(cost) + ' − ' + yen(residual) + ') ÷ ' + years + ' = ' + yen(annual) + '</div>')
      : (useRate
        ? '<div class="step">年間の減価償却費 = 取得原価 × 償却率</div>' +
          '<div class="step">' + yen(cost) + ' × ' + rate + ' = ' + yen(annual) + '</div>'
        : '<div class="step">年間の減価償却費 = 取得原価 ÷ 耐用年数</div>' +
          '<div class="step">' + yen(cost) + ' ÷ ' + years + ' = ' + yen(annual) + '</div>');
    const rateYearsStep = useRate ? '<div class="step" style="margin-top:16px;">耐用年数 = 1 ÷ 償却率 = 1 ÷ ' + rate + ' = ' + years + '年</div>' : '';
    const periodTop = useRate ? '<div class="step">' : '<div class="step" style="margin-top:16px;">';
    const periodStep = rateYearsStep + (useFYStart
      ? periodTop + '取得日から当期首までの経過期間 = ' + e + '年</div>' +
        '<div class="step formula">当期首時点の残りの耐用年数 = ' + years + '年 − ' + e + '年 = ' + (years - e) + '年</div>'
      : periodTop + '耐用年数' + years + '年 = ' + (years * 12) + 'か月</div>' +
        '<div class="step">取得日から当期首までの経過期間 = ' + elapsedPeriodText(usedMonths) + '</div>' +
        '<div class="step formula">当期首時点の残りの耐用年数 = ' + (years * 12) + 'か月 − ' + usedMonths + 'か月 = ' + remainingMonths + 'か月' + (remainingMonths >= 12 ? '(' + ymText(remainingMonths) + ')' : '') + '</div>');

    let resultSteps;
    if (useTenPercent) {
      const endCheck = '<div class="step">当期末の帳簿価額は、当期首の帳簿価額' + yen(bookValueStart) + ' − 当期の減価償却費' + yen(answer) + ' = ' + yen(bookValueStart - answer) + 'となり、残存価額(' + yen(residual) + ')と一致する</div>';
      resultSteps = useFYStart
        ? '<div class="step">当期中に耐用年数が到来するため、当期が償却最終年度となる</div>' +
          '<div class="step" style="margin-top:16px;">期首に取得しているため、最終年度も1年分を償却すると、帳簿価額がちょうど残存価額になる</div>' +
          '<div class="step formula">当期の減価償却費 = ' + yen(answer) + '</div>' +
          endCheck
        : '<div class="step">当期中に耐用年数が到来するため、当期が償却最終年度となる</div>' +
          '<div class="step" style="margin-top:16px;">償却最終年度は、残りの耐用年数(' + lastMonths + 'か月)分だけを月割で償却する</div>' +
          '<div class="step">当期の減価償却費 = 年間の減価償却費 × 残りの月数 ÷ 12</div>' +
          '<div class="step formula">' + yen(annual) + ' × ' + lastMonths + ' ÷ 12 = ' + yen(answer) + '</div>' +
          endCheck;
    } else if (isFinal) {
      resultSteps =
        '<div class="step">当期中に耐用年数が到来するため、当期が償却最終年度となる</div>' +
        '<div class="step" style="margin-top:16px;">当期首の帳簿価額 = 取得原価 − 年間の減価償却費 × ' + (useFYStart ? '経過年数' : '経過月数 ÷ 12') + '</div>' +
        '<div class="step formula">' + yen(cost) + ' − ' + yen(annual) + ' × ' + (useFYStart ? e : usedMonths + ' ÷ 12') + ' = ' + yen(bookValueStart) + '</div>' +
        '<div class="step" style="margin-top:16px;">償却最終年度は、備忘価額1円を残して帳簿価額の全額を償却する</div>' +
        '<div class="step">当期の減価償却費 = 当期首の帳簿価額 − 備忘価額</div>' +
        '<div class="step formula">' + yen(bookValueStart) + ' − ¥1 = ' + yen(answer) + '</div>';
    } else {
      const afterMonths = remainingMonths - 12;
      resultSteps =
        '<div class="step">当期末時点でも耐用年数が残っている(残り' + ymText(afterMonths) + ')ため、当期は償却最終年度ではない</div>' +
        '<div class="step" style="margin-top:16px;">備忘価額1円を残す処理は償却最終年度に行うため、当期は通常どおり1年分の減価償却費を計上する</div>' +
        '<div class="step formula">当期の減価償却費 = ' + yen(answer) + '</div>';
    }

    return {
      level: level, category: useTenPercent ? '定額法(償却最終年度・残存価額10%)' : '定額法(償却最終年度・備忘価額)',
      question: acqDateStr + 'に取得した' + item + '(取得原価 ' + yen(cost) + '、' + (useTenPercent ? '残存価額は取得原価の10%' : '残存価額はゼロ') + '、' + (useRate ? '償却率 ' + rate + '' : '耐用年数 ' + years + '年') + ')を定額法により減価償却している。' + (useTenPercent ? '' : 'なお、耐用年数の経過時には備忘価額1円を残して償却するものとする。') + '当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。',
      answer,
      explain: annualStep + periodStep + resultSteps
    };
  }

  /* ---------- 2級: 定率法(償却最終年度・備忘価額) ---------- */
  function genDecliningFinalYear() {
    const item = pickItemFavorBihin();
    const years = pick([5, 9]);
    const g = GUARANTEE[years];
    const isFinal = Math.random() < 0.6;
    const useMidYear = Math.random() < 0.25;

    // 取得から償却が終わるまでの全年度を計算する(最終年度は帳簿価額 − 1円)
    function simulate(cost, firstMonths) {
      const guaranteeAmount = Math.round(cost * g.guaranteeRate);
      const rows = [];
      let bv = cost, revisedCost = null, y = 0;
      while (bv > 1 && y < 30) {
        y += 1;
        const prorated = y === 1 && firstMonths < 12;
        const normalFull = Math.round(bv * g.rate);
        let dep, useRevised = false, normalShown = normalFull;
        if (prorated) {
          dep = Math.round(bv * g.rate * firstMonths / 12);
          normalShown = dep;
        } else if (revisedCost !== null) {
          dep = Math.round(revisedCost * g.revisedRate); useRevised = true;
        } else if (normalFull < guaranteeAmount) {
          revisedCost = bv; dep = Math.round(revisedCost * g.revisedRate); useRevised = true;
        } else {
          dep = normalFull;
        }
        let isLast = false;
        if (dep >= bv - 1) { dep = bv - 1; isLast = true; }
        rows.push({ beginningBV: bv, normalDep: normalShown, guaranteeAmt: prorated ? null : guaranteeAmount, depreciation: dep, endingBV: bv - dep, useRevised: useRevised && !isLast, isFinal: isLast, isProrated: prorated, months: firstMonths, revisedCost: revisedCost });
        bv -= dep;
      }
      return { rows, guaranteeAmount };
    }

    let cost, firstMonths, sim, finalIndex, tries = 0;
    do {
      firstMonths = useMidYear ? randInt(1, 11) : 12;
      const mult = 12 / gcd(12, firstMonths);
      cost = mult * randInt(Math.ceil(3000 / mult), Math.floor(900000 / mult)) * 100;
      sim = simulate(cost, firstMonths);
      finalIndex = sim.rows.length;
      tries++;
    } while ((finalIndex !== (useMidYear ? years + 1 : years) || !sim.rows[finalIndex - 2].useRevised) && tries < 100);

    const currentYear = isFinal ? finalIndex : finalIndex - 1;
    const rows = sim.rows.slice(0, currentYear);
    const cur = rows[rows.length - 1];
    const answer = cur.depreciation;
    const bookValueStart = cur.beginningBV;
    const revisedCost = cur.revisedCost;
    const switchedBefore = rows.length >= 2 && rows[rows.length - 2].useRevised;
    const e = currentYear - 1;

    let acqDateStr;
    if (useMidYear) {
      const d = fyMonthToDate(CURRENT_FY - e, 13 - firstMonths);
      acqDateStr = Math.random() < 0.5 ? dateStrAnyDay(d.year, d.month) : dateStr(d.year, d.month);
    } else {
      const acq = pastFYStart(e);
      acqDateStr = dateStr(acq.year, acq.month);
    }

    let resultSteps;
    if (isFinal) {
      resultSteps = (useMidYear
          ? '<div class="step">初年度が' + firstMonths + 'か月分の月割だったため、' + currentYear + '年目(当期)が償却最終年度になる</div>'
          : '<div class="step">当期は耐用年数' + years + '年の最終年度(' + years + '年目)である</div>') +
        '<div class="step" style="margin-top:16px;">償却最終年度は、備忘価額1円を残して帳簿価額の全額を償却する</div>' +
        '<div class="step">当期の減価償却費 = 当期首の帳簿価額 − 備忘価額</div>' +
        '<div class="step formula">' + yen(bookValueStart) + ' − ¥1 = ' + yen(answer) + '</div>';
    } else {
      resultSteps = (useMidYear
          ? '<div class="step">初年度が' + firstMonths + 'か月分の月割だったため、償却最終年度は' + finalIndex + '年目になる。当期(' + currentYear + '年目)は償却最終年度ではないため、備忘価額1円を残す処理は行わない</div>'
          : '<div class="step">当期は耐用年数' + years + '年のうち' + currentYear + '年目であり、償却最終年度ではないため、備忘価額1円を残す処理は行わない</div>') +
        '<div class="step" style="margin-top:16px;">' + (switchedBefore ? '前期までに改定償却率に切り替わっているため、' : '通常の償却額が償却保証額を下回るため、') + '改定取得価額 × 改定償却率で計算する</div>' +
        '<div class="step">当期の減価償却費 = 改定取得価額 × 改定償却率</div>' +
        '<div class="step formula">' + yen(revisedCost) + ' × ' + g.revisedRate + ' = ' + yen(answer) + '</div>';
    }

    return {
      level: '2', category: '定率法(償却最終年度・備忘価額)',
      question: acqDateStr + '取得の' + item + '(取得原価 ' + yen(cost) + '、残存価額はゼロ、耐用年数 ' + years + '年、定率法・償却率 ' + g.rate + '、保証率 ' + g.guaranteeRate + '、改定償却率 ' + g.revisedRate + ')により減価償却している。なお、耐用年数の経過時には備忘価額1円を残して償却するものとする。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい(計算の過程で端数が生じる場合は円未満四捨五入)。',
      answer,
      explain: '<div class="step">定率法では残存価額は使用せず、取得日から当期首までの期間をもとに期首帳簿価額を計算する' + (useMidYear ? '(初年度' + firstMonths + 'か月分は月割計算)' : '') + '</div>' +
        buildYearTableGuarantee(rows) +
        resultSteps
    };
  }

  /* ---------- 2級: 生産高比例法 ---------- */
  function genProductionUnits() {
    const item = pick(['車両運搬具', '機械装置']);
    const unit = item === '車両運搬具' ? 'km' : '時間';
    const residualRate = pickResidualRate();
    let totalCapacity, currentUsage;
    if (item === '車両運搬具') {
      totalCapacity = randInt(50, 500) * 1000;
      currentUsage = (totalCapacity / 100) * randInt(1, 9);
    } else {
      totalCapacity = randInt(50, 300) * 100;
      currentUsage = (totalCapacity / 100) * randInt(5, 30);
    }
    const factor = residualRate === 0 ? 1 : 9;
    const costLimitAdjusted = residualRate === 0 ? 99000000 : Math.floor(98000000 * 9 / 10);
    const maxPerUnitBase = Math.max(2, Math.min(residualRate === 0 ? 150 : 17, Math.floor(costLimitAdjusted / totalCapacity / 10 / factor)));
    let perUnitBase = randInt(2, maxPerUnitBase);
    let perUnit = factor * perUnitBase * 10;
    let dep = perUnit * totalCapacity;
    let costResult = buildCostFromDep(dep, residualRate);
    while (costResult.cost >= 100000000 && perUnitBase > 1) {
      perUnitBase -= 1;
      perUnit = factor * perUnitBase * 10;
      dep = perUnit * totalCapacity;
      costResult = buildCostFromDep(dep, residualRate);
    }
    const cost = costResult.cost;
    const residual = costResult.residual;
    const answer = perUnit * currentUsage;
    return {
      level: '2', category: '生産高比例法',
      question: item + '(取得原価 ' + yen(cost) + '、' + residualText(residualRate) + '、総利用可能量 ' + totalCapacity.toLocaleString('ja-JP') + unit + ')を生産高比例法により減価償却する。当期の利用量が' + currentUsage.toLocaleString('ja-JP') + unit + 'であったとき、当期の減価償却費はいくらか。',
      answer,
      explain: (residual === 0
          ? '<div class="step">1' + unit + 'あたりの償却額 = 取得原価 ÷ 総利用可能量</div>' +
            '<div class="step">' + yen(cost) + ' ÷ ' + totalCapacity.toLocaleString('ja-JP') + unit + ' = ' + yen(perUnit) + '</div>'
          : '<div class="step">1' + unit + 'あたりの償却額 = (取得原価 − 残存価額) ÷ 総利用可能量</div>' +
            '<div class="step">(' + yen(cost) + ' − ' + yen(residual) + ') ÷ ' + totalCapacity.toLocaleString('ja-JP') + unit + ' = ' + yen(perUnit) + '</div>') +
        '<div class="step" style="margin-top:16px;">当期の減価償却費 = 1' + unit + 'あたりの償却額 × 当期利用量</div>' +
        '<div class="step formula">' + yen(perUnit) + ' × ' + currentUsage.toLocaleString('ja-JP') + unit + ' = ' + yen(answer) + '</div>'
    };
  }

  /* ---------- 2級: 生産高比例法(償却最終年度) ---------- */
  function genProductionUnitsFinalYear() {
    const item = pick(['車両運搬具', '機械装置']);
    const unit = item === '車両運搬具' ? 'km' : '時間';
    const useTenPercent = Math.random() < 0.4;
    const residualRate = useTenPercent ? 0.1 : 0;
    const isFinal = useTenPercent ? true : Math.random() < 0.6;
    const unitScale = item === '車両運搬具' ? 1000 : 100;
    const totalBase = item === '車両運搬具' ? randInt(50, 500) : randInt(50, 300);
    const totalCapacity = totalBase * unitScale;
    let prevBase, curBase;
    if (isFinal) {
      prevBase = randInt(Math.floor(totalBase * 0.8), totalBase - 2);
      curBase = Math.random() < 0.25 ? totalBase : totalBase + randInt(1, Math.max(1, Math.floor(totalBase * 0.1)));
    } else {
      prevBase = randInt(Math.floor(totalBase * 0.5), Math.floor(totalBase * 0.75));
      curBase = randInt(prevBase + Math.max(1, Math.floor(totalBase * 0.05)), totalBase - 1);
    }
    const prevCumulative = prevBase * unitScale;
    const currentCumulative = curBase * unitScale;
    const currentUsage = currentCumulative - prevCumulative;
    const remainingCapacity = totalCapacity - prevCumulative;

    const factor = residualRate === 0 ? 1 : 9;
    const costLimitAdjusted = residualRate === 0 ? 99000000 : Math.floor(98000000 * 9 / 10);
    let perUnitBase = randInt(2, Math.max(2, Math.min(residualRate === 0 ? 150 : 17, Math.floor(costLimitAdjusted / totalCapacity / 10 / factor))));
    let perUnit = factor * perUnitBase * 10;
    let costResult = buildCostFromDep(perUnit * totalCapacity, residualRate);
    while (costResult.cost >= 100000000 && perUnitBase > 1) {
      perUnitBase -= 1;
      perUnit = factor * perUnitBase * 10;
      costResult = buildCostFromDep(perUnit * totalCapacity, residualRate);
    }
    const cost = costResult.cost;
    const residual = costResult.residual;
    const bookValueStart = cost - perUnit * prevCumulative;
    let answer;
    if (!isFinal) answer = perUnit * currentUsage;
    else answer = useTenPercent ? perUnit * remainingCapacity : bookValueStart - 1;

    const f = function (n) { return n.toLocaleString('ja-JP') + unit; };
    const usageSteps = '<div class="step">当期の利用量 = 当期末までの累計利用量 − 前期末までの累計利用量</div>' +
      '<div class="step formula">' + f(currentCumulative) + ' − ' + f(prevCumulative) + ' = ' + f(currentUsage) + '</div>';
    let resultSteps;
    if (isFinal) {
      const reachText = currentCumulative === totalCapacity ? '総利用可能量(' + f(totalCapacity) + ')に達する' : '総利用可能量(' + f(totalCapacity) + ')を超える';
      resultSteps =
        '<div class="step" style="margin-top:16px;">当期末までの累計利用量(' + f(currentCumulative) + ')が' + reachText + 'ため、当期が償却最終年度となる</div>' +
        '<div class="step">償却できるのは、残りの利用可能量の分だけである</div>' +
        '<div class="step formula">残りの利用可能量 = ' + f(totalCapacity) + ' − ' + f(prevCumulative) + ' = ' + f(remainingCapacity) + '</div>' +
        (useTenPercent
          ? '<div class="step" style="margin-top:16px;">減価償却費 = (取得原価 − 残存価額) × 残りの利用可能量 ÷ 総利用可能量</div>' +
            '<div class="step formula">(' + yen(cost) + ' − ' + yen(residual) + ') × ' + remainingCapacity.toLocaleString('ja-JP') + ' ÷ ' + totalCapacity.toLocaleString('ja-JP') + ' = ' + yen(answer) + '</div>' +
            '<div class="step">当期末の帳簿価額は、当期首の帳簿価額' + yen(bookValueStart) + ' − 当期の減価償却費' + yen(answer) + ' = ' + yen(bookValueStart - answer) + 'となり、残存価額(' + yen(residual) + ')と一致する</div>'
          : '<div class="step" style="margin-top:16px;">当期首の帳簿価額 = 取得原価 − 取得原価 × 前期末までの累計利用量 ÷ 総利用可能量</div>' +
            '<div class="step formula">' + yen(cost) + ' − ' + yen(cost) + ' × ' + prevCumulative.toLocaleString('ja-JP') + ' ÷ ' + totalCapacity.toLocaleString('ja-JP') + ' = ' + yen(bookValueStart) + '</div>' +
            '<div class="step" style="margin-top:16px;">償却最終年度は、備忘価額1円を残して帳簿価額の全額を償却する</div>' +
            '<div class="step">当期の減価償却費 = 当期首の帳簿価額 − 備忘価額</div>' +
            '<div class="step formula">' + yen(bookValueStart) + ' − ¥1 = ' + yen(answer) + '</div>');
    } else {
      resultSteps =
        '<div class="step" style="margin-top:16px;">当期末までの累計利用量(' + f(currentCumulative) + ')は総利用可能量(' + f(totalCapacity) + ')に達していないため、当期は償却最終年度ではない</div>' +
        '<div class="step">備忘価額1円を残す処理は償却最終年度に行うため、当期は通常どおり当期の利用量に応じて償却する</div>' +
        '<div class="step" style="margin-top:16px;">減価償却費 = 取得原価 × 当期利用量 ÷ 総利用可能量</div>' +
        '<div class="step formula">' + yen(cost) + ' × ' + currentUsage.toLocaleString('ja-JP') + ' ÷ ' + totalCapacity.toLocaleString('ja-JP') + ' = ' + yen(answer) + '</div>';
    }

    return {
      level: '2', category: useTenPercent ? '生産高比例法(償却最終年度・残存価額10%)' : '生産高比例法(償却最終年度・備忘価額)',
      question: '過年度に取得した' + item + '(取得原価 ' + yen(cost) + '、' + residualText(residualRate) + '、総利用可能量 ' + totalCapacity.toLocaleString('ja-JP') + unit + ')を生産高比例法により減価償却している。前期末までの累計利用量は' + f(prevCumulative) + '、当期末までの累計利用量は' + f(currentCumulative) + 'であった。' + (useTenPercent ? '' : 'なお、利用可能量をすべて利用した時点で備忘価額1円を残して償却するものとする。') + '当期の減価償却費はいくらか。',
      answer,
      explain: usageSteps + resultSteps
    };
  }

  /* ---------- 1級: 生産高比例法(総利用可能量の見積り変更) ---------- */
  function genProductionUnitsCumulative() {
    if (Math.random() < 0.3) return genProductionUnitsFinalYear();
    const item = pick(['車両運搬具', '機械装置']);
    const unit = item === '車両運搬具' ? 'km' : '時間';
    const residualRate = pickResidualRate();
    const unitScale = item === '車両運搬具' ? 1000 : 100;
    const totalCapacityBase = item === '車両運搬具' ? randInt(50, 500) : randInt(50, 300);
    const totalCapacity = totalCapacityBase * unitScale;

    const prevUsageBase = randInt(Math.max(5, Math.floor(totalCapacityBase * 0.15)), Math.floor(totalCapacityBase * 0.45));
    const currentTotalUsageBase = randInt(prevUsageBase + Math.max(5, Math.floor(totalCapacityBase * 0.15)), Math.floor(totalCapacityBase * 0.85));
    const prevCumulativeUsage = prevUsageBase * unitScale;
    const currentCumulativeUsage = currentTotalUsageBase * unitScale;
    const currentPeriodUsage = currentCumulativeUsage - prevCumulativeUsage;

    const factor = residualRate === 0 ? 1 : 9;
    const costLimitAdjusted = residualRate === 0 ? 99000000 : Math.floor(98000000 * 9 / 10);
    const maxPerUnitBase = Math.max(2, Math.min(residualRate === 0 ? 150 : 17, Math.floor(costLimitAdjusted / totalCapacity / 10 / factor)));
    let perUnitBase = randInt(2, maxPerUnitBase);
    let perUnit = factor * perUnitBase * 10;
    let dep = perUnit * totalCapacity;
    let costResult = buildCostFromDep(dep, residualRate);
    while (costResult.cost >= 100000000 && perUnitBase > 1) {
      perUnitBase -= 1;
      perUnit = factor * perUnitBase * 10;
      dep = perUnit * totalCapacity;
      costResult = buildCostFromDep(dep, residualRate);
    }
    const cost = costResult.cost;
    const residual = costResult.residual;
    const answer = perUnit * currentPeriodUsage;

    return {
      level: '2', category: '生産高比例法(累計利用量から算定)',
      question: '前期首に取得した' + item + '(取得原価 ' + yen(cost) + '、' + residualText(residualRate) + '、総利用可能量 ' + totalCapacity.toLocaleString('ja-JP') + unit + ')を生産高比例法により減価償却している。前期末までの累計利用量は' + prevCumulativeUsage.toLocaleString('ja-JP') + unit + '、当期末までの累計利用量は' + currentCumulativeUsage.toLocaleString('ja-JP') + unit + 'であった。当期の減価償却費はいくらか。',
      answer,
      explain: '<div class="step">当期の利用量 = 当期末までの累計利用量 − 前期末までの累計利用量</div>' + '<div class="step formula">' + currentCumulativeUsage.toLocaleString('ja-JP') + unit + ' − ' + prevCumulativeUsage.toLocaleString('ja-JP') + unit + ' = ' + currentPeriodUsage.toLocaleString('ja-JP') + unit + '</div>' +
        (residual === 0
          ? '<div class="step" style="margin-top:16px;">減価償却費 = 取得原価 × 当期利用量 ÷ 総利用可能量</div>' +
            '<div class="step formula">' + yen(cost) + ' × ' + currentPeriodUsage.toLocaleString('ja-JP') + ' ÷ ' + totalCapacity.toLocaleString('ja-JP') + ' = ' + yen(answer) + '</div>'
          : '<div class="step" style="margin-top:16px;">減価償却費 = (取得原価 − 残存価額) × 当期利用量 ÷ 総利用可能量</div>' +
            '<div class="step formula">(' + yen(cost) + ' − ' + yen(residual) + ') × ' + currentPeriodUsage.toLocaleString('ja-JP') + ' ÷ ' + totalCapacity.toLocaleString('ja-JP') + ' = ' + yen(answer) + '</div>')
    };
  }

  function genProductionUnitsEstimateChange() {
    let residualRate = pickResidualRate();
    let factor = residualRate === 0 ? 1 : 9;

    const useTotalCapacityVariant = Math.random() < 0.5;

    let originalCost, residual, originalPerUnitRate, originalTotalCapacity, cumulativeUsage, cumulativeUsageBase,
      totalCapacityBase, bookValueAtRevision, remainingDepreciableAmount, revisedRemainingCapacity, revisedTotalCapacityForDisplay,
      newPerUnitRate, unit, item, unitScale;

    if (useTotalCapacityVariant) {
      item = pick(['車両運搬具', '機械装置']);
      unit = item === '車両運搬具' ? 'km' : '時間';
      unitScale = item === '車両運搬具' ? 1000 : 100;
      residualRate = pickResidualRate();
      factor = residualRate === 0 ? 1 : 9;

      let built = null;
      for (let tries = 0; tries < 100 && !built; tries++) {
        const g = randInt(3, 20);
        const a = randInt(2, 8);
        const b = randInt(2, 8);
        const c = randInt(2, 3);
        const cUsageBase = g * a;
        const rRemainingBase = g * b;
        const rOriginalBase = g * b * c;
        const tCapacityBase = cUsageBase + rOriginalBase;
        const maxTotal = item === '車両運搬具' ? 500 : 300;
        if (tCapacityBase < 40 || tCapacityBase > maxTotal * 3) continue;

        const oTotalCapacity = tCapacityBase * unitScale;
        const baseRate = (a + b) * 10;
        const rateUnit = baseRate * factor;
        const targetDepLow = 900000, targetDepHigh = 45000000;
        const lo = Math.max(1, Math.ceil(targetDepLow / oTotalCapacity / rateUnit));
        const hi = Math.floor(targetDepHigh / oTotalCapacity / rateUnit);
        if (hi < lo) continue;
        const mPrime = randInt(lo, hi);
        const oPerUnitRate = rateUnit * mPrime;

        const cUsage = cUsageBase * unitScale;
        const dep = oPerUnitRate * oTotalCapacity;
        const c1 = buildCostFromDep(dep, residualRate);
        const bva = c1.cost - oPerUnitRate * cUsage;
        const remDep = bva - c1.residual;
        const rRemaining = rRemainingBase * unitScale;
        const rTotalBase = rRemainingBase + cUsageBase;

        built = {
          originalCost: c1.cost, residual: c1.residual, originalPerUnitRate: oPerUnitRate,
          originalTotalCapacity: oTotalCapacity, cumulativeUsage: cUsage, cumulativeUsageBase: cUsageBase,
          totalCapacityBase: tCapacityBase, bookValueAtRevision: bva, remainingDepreciableAmount: remDep,
          revisedRemainingCapacity: rRemaining, revisedTotalCapacityForDisplay: rTotalBase * unitScale
        };
      }
      if (!built) {
        // 極めて稀なフォールバック: 少なくとも正解パスは整数になるよう約数から選ぶ
        const tCapacityBase = item === '車両運搬具' ? randInt(50, 500) : randInt(50, 300);
        const oTotalCapacity = tCapacityBase * unitScale;
        const maxBase = Math.max(2, Math.min(20, Math.floor(45000000 / oTotalCapacity / 10 / factor)));
        const oPerUnitRate = randInt(2, maxBase) * factor * 10;
        const dep = oPerUnitRate * oTotalCapacity;
        const c1 = buildCostFromDep(dep, residualRate);
        const cUsageBase = randInt(Math.max(10, Math.floor(tCapacityBase * 0.2)), Math.floor(tCapacityBase * 0.6));
        const cUsage = cUsageBase * unitScale;
        const bva = c1.cost - oPerUnitRate * cUsage;
        const remDep = bva - c1.residual;
        const remDepBaseFallback = remDep / unitScale;
        const remOriginalBaseFallback = tCapacityBase - cUsageBase;
        const fallbackCandidates = [];
        for (let d = 1; d * d <= remDepBaseFallback; d++) {
          if (remDepBaseFallback % d !== 0) continue;
          [d, remDepBaseFallback / d].forEach(function (cand) {
            if (cand >= 10 && cand !== remOriginalBaseFallback) fallbackCandidates.push(cand);
          });
        }
        const rRemainingBase = fallbackCandidates.length ? pick(fallbackCandidates) : remOriginalBaseFallback;
        built = {
          originalCost: c1.cost, residual: c1.residual, originalPerUnitRate: oPerUnitRate,
          originalTotalCapacity: oTotalCapacity, cumulativeUsage: cUsage, cumulativeUsageBase: cUsageBase,
          totalCapacityBase: tCapacityBase, bookValueAtRevision: bva, remainingDepreciableAmount: remDep,
          revisedRemainingCapacity: rRemainingBase * unitScale, revisedTotalCapacityForDisplay: (rRemainingBase + cUsageBase) * unitScale
        };
      }

      originalCost = built.originalCost; residual = built.residual; originalPerUnitRate = built.originalPerUnitRate;
      originalTotalCapacity = built.originalTotalCapacity; cumulativeUsage = built.cumulativeUsage; cumulativeUsageBase = built.cumulativeUsageBase;
      totalCapacityBase = built.totalCapacityBase; bookValueAtRevision = built.bookValueAtRevision; remainingDepreciableAmount = built.remainingDepreciableAmount;
      revisedRemainingCapacity = built.revisedRemainingCapacity; revisedTotalCapacityForDisplay = built.revisedTotalCapacityForDisplay;
      newPerUnitRate = remainingDepreciableAmount / revisedRemainingCapacity;
    } else {
      item = pick(['車両運搬具', '機械装置']);
      unit = item === '車両運搬具' ? 'km' : '時間';
      unitScale = item === '車両運搬具' ? 1000 : 100;
      residualRate = pickResidualRate();
      factor = residualRate === 0 ? 1 : 9;

      totalCapacityBase = item === '車両運搬具' ? randInt(50, 500) : randInt(50, 300);
      originalTotalCapacity = totalCapacityBase * unitScale;
      const maxOriginalPerUnitBase = Math.max(2, Math.min(20, Math.floor(99000000 / originalTotalCapacity / 10 / factor)));
      const originalPerUnitRateBase = randInt(2, maxOriginalPerUnitBase) * factor;
      originalPerUnitRate = originalPerUnitRateBase * 10;
      const dep = originalPerUnitRate * originalTotalCapacity;
      const c1 = buildCostFromDep(dep, residualRate);
      originalCost = c1.cost; residual = c1.residual;

      cumulativeUsageBase = randInt(Math.max(10, Math.floor(totalCapacityBase * 0.2)), Math.floor(totalCapacityBase * 0.6));
      cumulativeUsage = cumulativeUsageBase * unitScale;
      const remainingOriginal = originalTotalCapacity - cumulativeUsage;
      bookValueAtRevision = originalCost - originalPerUnitRate * cumulativeUsage;
      remainingDepreciableAmount = bookValueAtRevision - residual;

      const remainingBase = remainingOriginal / unitScale;
      const candidates = [];
      for (let ratioNum = 5; ratioNum <= 15; ratioNum++) {
        const candidateBase = Math.round(remainingBase * ratioNum / 10);
        if (candidateBase < 10 || candidateBase === remainingBase) continue;
        const candidateCapacity = candidateBase * unitScale;
        if (remainingDepreciableAmount % candidateCapacity === 0) candidates.push(candidateCapacity);
      }
      revisedRemainingCapacity = candidates.length ? pick(candidates) : remainingOriginal;
      revisedTotalCapacityForDisplay = null;
      newPerUnitRate = remainingDepreciableAmount / revisedRemainingCapacity;
    }

    const currentUsageBase = randInt(1, Math.max(1, Math.floor((revisedRemainingCapacity / unitScale) * 0.5)));
    const currentUsage = currentUsageBase * unitScale;
    const answer = newPerUnitRate * currentUsage;

    const reasons = ['新たな資源(埋蔵量)の調査結果により', '利用状況の変化により', '技術的な調査の結果', '追加の地質調査により'];
    const reason = pick(reasons);

    const cumulativeUsageRatio = cumulativeUsageBase / totalCapacityBase;
    let elapsedYears;
    if (cumulativeUsageRatio < 0.3) elapsedYears = randInt(1, 2);
    else if (cumulativeUsageRatio < 0.45) elapsedYears = randInt(2, 3);
    else elapsedYears = randInt(3, 5);
    const acq = pastDate(elapsedYears);
    const acqDateStr = dateStrAnyDay(acq.year, acq.month);

    const revisionClause = useTotalCapacityVariant
      ? '総利用可能量を' + revisedTotalCapacityForDisplay.toLocaleString('ja-JP') + unit + 'に見積り直した'
      : '残りの利用可能量を' + revisedRemainingCapacity.toLocaleString('ja-JP') + unit + 'に見積り直した';
    const revisionExplainStep = useTotalCapacityVariant
      ? '<div class="step"' + (residualRate !== 0 ? ' style="margin-top:16px;"' : '') + '>変更後の総利用可能量は' + revisedTotalCapacityForDisplay.toLocaleString('ja-JP') + unit + 'であり、既に利用した' + cumulativeUsage.toLocaleString('ja-JP') + unit + '分を差し引いた残りの利用可能量で償却する</div>' +
        '<div class="step formula">残りの利用可能量 = ' + revisedTotalCapacityForDisplay.toLocaleString('ja-JP') + unit + ' − ' + cumulativeUsage.toLocaleString('ja-JP') + unit + ' = ' + revisedRemainingCapacity.toLocaleString('ja-JP') + unit + '</div>'
      : '';
    const residualExplainStep = residualRate === 0 ? '' :
      '<div class="step">利用可能量をすべて利用した後も残存価額' + yen(residual) + 'を残す必要があるため、見積り変更時点の帳簿価額から残存価額を差し引いた残りの要償却額をもとに計算する</div>' +
      '<div class="step">残りの要償却額 = 見積り変更時点の帳簿価額 − 残存価額</div>' + '<div class="step formula">' + yen(bookValueAtRevision) + ' − ' + yen(residual) + ' = ' + yen(remainingDepreciableAmount) + '</div>';

    return {
      level: '1', category: '見積り変更(生産高比例法)',
      question: acqDateStr + 'に取得した' + item + '(取得原価 ' + yen(originalCost) + '、' + residualText(residualRate) + '、取得時の総利用可能量 ' + originalTotalCapacity.toLocaleString('ja-JP') + unit + ')を生産高比例法により減価償却してきた。累計利用量が' + cumulativeUsage.toLocaleString('ja-JP') + unit + 'に達した当期首(' + fyStartDateStr(CURRENT_FY) + ')に、' + reason + '、' + revisionClause + '。当期(' + fyLabel(CURRENT_FY) + ')の利用量が' + currentUsage.toLocaleString('ja-JP') + unit + 'であったとき、当期の減価償却費はいくらか。',
      answer,
      explain: (residual === 0
          ? '<div class="step">変更前の1' + unit + 'あたりの償却額 = 取得原価 ÷ 取得時の総利用可能量</div>' +
            '<div class="step">' + yen(originalCost) + ' ÷ ' + originalTotalCapacity.toLocaleString('ja-JP') + unit + ' = ' + yen(originalPerUnitRate) + '</div>'
          : '<div class="step">変更前の1' + unit + 'あたりの償却額 = (取得原価 − 残存価額) ÷ 取得時の総利用可能量</div>' +
            '<div class="step">(' + yen(originalCost) + ' − ' + yen(residual) + ') ÷ ' + originalTotalCapacity.toLocaleString('ja-JP') + unit + ' = ' + yen(originalPerUnitRate) + '</div>') +
        buildProductionChangeTable([
          { label: '変更前(累計)', beginningBV: originalCost, remainingCapacity: originalTotalCapacity.toLocaleString('ja-JP') + unit, depreciation: originalPerUnitRate * cumulativeUsage, endingBV: bookValueAtRevision },
          { label: '当期', beginningBV: bookValueAtRevision, remainingCapacity: revisedRemainingCapacity.toLocaleString('ja-JP') + unit, depreciation: answer, endingBV: bookValueAtRevision - answer }
        ]) +
        '<div class="step">見積りの変更は将来に向かってのみ適用する(過去の減価償却費は修正しない)</div>' +
        residualExplainStep +
        revisionExplainStep +
        '<div class="step"' + ((useTotalCapacityVariant ? residualRate === 0 : residualRate !== 0) ? ' style="margin-top:16px;"' : '') + '>変更後の1' + unit + 'あたりの償却額 = ' + (residualRate === 0 ? '見積り変更時点の帳簿価額' : '残りの要償却額') + ' ÷ 残りの利用可能量</div>' +
        '<div class="step">' + yen(remainingDepreciableAmount) + ' ÷ ' + revisedRemainingCapacity.toLocaleString('ja-JP') + unit + ' = ' + yen(newPerUnitRate) + '</div>' +
        '<div class="step">当期の減価償却費 = 変更後の1' + unit + 'あたりの償却額 × 当期の利用量</div>' +
        '<div class="step formula">' + yen(newPerUnitRate) + ' × ' + currentUsage.toLocaleString('ja-JP') + unit + ' = ' + yen(answer) + '</div>'
    };
  }

  /* ---------- 2級: 無形固定資産の償却 ---------- */
  /* ---------- 2級: 繰延資産の償却 ---------- */
  const DEFERRED_ASSETS = [
    { id: 'development', name: '開発費', maxYears: 5, dateType: 'simple' },
    { id: 'stock', name: '株式交付費', maxYears: 3, dateType: 'stock' },
    { id: 'founding', name: '創立費', maxYears: 5, dateType: 'founding' },
    { id: 'opening', name: '開業費', maxYears: 5, dateType: 'founding' },
    { id: 'bond', name: '社債発行費等', maxYears: null, dateType: 'bond' },
    { id: 'warrant', name: '社債発行費等', maxYears: 3, dateType: 'warrant' }
  ];

  function computeDeferredMult(years, elapsedMonthsTotal, checkWrongYears) {
    const remainingMonths = years * 12 - elapsedMonthsTotal;
    if (remainingMonths <= 0) return null;
    let universalMult = 12 / gcd(12, elapsedMonthsTotal);
    const wrongChecks = [];
    for (let i = 0; i < checkWrongYears.length; i++) {
      const wy = checkWrongYears[i];
      const wrongRemaining = wy * 12 - elapsedMonthsTotal;
      if (wrongRemaining > 0) {
        const need = wrongRemaining / gcd(wrongRemaining, remainingMonths);
        universalMult = lcm(universalMult, need);
        wrongChecks.push(wrongRemaining);
      }
    }
    return { elapsedMonthsTotal: elapsedMonthsTotal, remainingMonths: remainingMonths, wrongChecks: wrongChecks, universalMult: universalMult };
  }

  function buildPastAcquisition(years, elapsed, checkWrongYears, midYearProb) {
    const useMidYearPast = Math.random() < (midYearProb === undefined ? 0.6 : midYearProb);
    if (!useMidYearPast) {
      const result = computeDeferredMult(years, elapsed * 12, checkWrongYears);
      return { useMidYearPast: false, useFixedMidYearDatePast: false, acqGapMonths: 0, elapsedMonthsTotal: result.elapsedMonthsTotal, remainingMonths: result.remainingMonths, wrongChecks: result.wrongChecks, universalMult: result.universalMult };
    }
    const midYearMonthPast = fixedTrapCalendarMonth();
    const fixedAcqGapMonths = (midYearMonthPast - FY_START_MONTH + 12) % 12;
    const useFixedMidYearDatePast = Math.random() < 0.5;
    if (useFixedMidYearDatePast) {
      const firstYearMonths = 12 - fixedAcqGapMonths;
      const elapsedMonthsTotal = firstYearMonths + (elapsed - 1) * 12;
      const result = computeDeferredMult(years, elapsedMonthsTotal, checkWrongYears);
      if (result) {
        return { useMidYearPast: true, useFixedMidYearDatePast: true, acqGapMonths: fixedAcqGapMonths, elapsedMonthsTotal: result.elapsedMonthsTotal, remainingMonths: result.remainingMonths, wrongChecks: result.wrongChecks, universalMult: result.universalMult };
      }
    }
    let best = null;
    for (let acqGapMonths = 1; acqGapMonths <= 11; acqGapMonths++) {
      const firstYearMonths = 12 - acqGapMonths;
      const elapsedMonthsTotal = firstYearMonths + (elapsed - 1) * 12;
      const result = computeDeferredMult(years, elapsedMonthsTotal, checkWrongYears);
      if (result && (best === null || result.universalMult < best.universalMult)) {
        best = result;
        best.acqGapMonths = acqGapMonths;
      }
    }
    return { useMidYearPast: true, useFixedMidYearDatePast: false, acqGapMonths: best.acqGapMonths, elapsedMonthsTotal: best.elapsedMonthsTotal, remainingMonths: best.remainingMonths, wrongChecks: best.wrongChecks, universalMult: best.universalMult };
  }

  function computeFoundingMult(years, elapsedMonthsForFounding, elapsedMonthsForOpening, checkWrongYears) {
    const remainingMonthsForFounding = years * 12 - elapsedMonthsForFounding;
    const remainingMonthsForOpening = years * 12 - elapsedMonthsForOpening;
    if (remainingMonthsForFounding <= 0 || remainingMonthsForOpening <= 0) return null;

    let universalMult = lcm(12 / gcd(12, elapsedMonthsForFounding), 12 / gcd(12, elapsedMonthsForOpening));
    universalMult = lcm(universalMult, remainingMonthsForFounding / gcd(remainingMonthsForFounding, remainingMonthsForOpening));
    universalMult = lcm(universalMult, remainingMonthsForOpening / gcd(remainingMonthsForFounding, remainingMonthsForOpening));

    for (let i = 0; i < checkWrongYears.length; i++) {
      const wy = checkWrongYears[i];
      const wrongRemFounding = wy * 12 - elapsedMonthsForFounding;
      const wrongRemOpening = wy * 12 - elapsedMonthsForOpening;
      if (wrongRemFounding > 0) {
        universalMult = lcm(universalMult, wrongRemFounding / gcd(wrongRemFounding, remainingMonthsForFounding));
        universalMult = lcm(universalMult, wrongRemFounding / gcd(wrongRemFounding, remainingMonthsForOpening));
      }
      if (wrongRemOpening > 0) {
        universalMult = lcm(universalMult, wrongRemOpening / gcd(wrongRemOpening, remainingMonthsForOpening));
        universalMult = lcm(universalMult, wrongRemOpening / gcd(wrongRemOpening, remainingMonthsForFounding));
      }
    }
    return { elapsedMonthsForFounding: elapsedMonthsForFounding, elapsedMonthsForOpening: elapsedMonthsForOpening, remainingMonthsForFounding: remainingMonthsForFounding, remainingMonthsForOpening: remainingMonthsForOpening, universalMult: universalMult };
  }

  function buildFoundingPastAcquisition(years, elapsed, checkWrongYears) {
    const useMidYearPast = Math.random() < 0.6;
    const midYearMonthPast = fixedTrapCalendarMonth();
    const fixedFoundingGap = (midYearMonthPast - FY_START_MONTH + 12) % 12;
    const useFixedMidYearDatePast = useMidYearPast && fixedFoundingGap !== 0 && Math.random() < 0.5;
    let best = null;
    const foundingGapOptions = !useMidYearPast ? [0] : (useFixedMidYearDatePast ? [fixedFoundingGap] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    for (let gi = 0; gi < foundingGapOptions.length; gi++) {
      const foundingGap = foundingGapOptions[gi];
      const elapsedMonthsForFounding = foundingGap === 0 ? elapsed * 12 : (12 - foundingGap) + (elapsed - 1) * 12;
      for (let openGap = 1; openGap <= 4; openGap++) {
        const elapsedMonthsForOpening = elapsedMonthsForFounding - openGap;
        if (elapsedMonthsForOpening < 1) continue;
        const result = computeFoundingMult(years, elapsedMonthsForFounding, elapsedMonthsForOpening, checkWrongYears);
        if (result && (best === null || result.universalMult < best.universalMult)) {
          best = result;
          best.foundingGap = foundingGap;
          best.openGap = openGap;
        }
      }
    }
    if (best === null) {
      return buildFoundingPastAcquisitionFYStart(years, elapsed, checkWrongYears);
    }
    best.useFixedMidYearDatePast = useFixedMidYearDatePast && best.foundingGap === fixedFoundingGap;
    return best;
  }

  function buildFoundingPastAcquisitionFYStart(years, elapsed, checkWrongYears) {
    let best = null;
    const elapsedMonthsForFounding = elapsed * 12;
    for (let openGap = 1; openGap <= 4; openGap++) {
      const elapsedMonthsForOpening = elapsedMonthsForFounding - openGap;
      if (elapsedMonthsForOpening < 1) continue;
      const result = computeFoundingMult(years, elapsedMonthsForFounding, elapsedMonthsForOpening, checkWrongYears);
      if (result && (best === null || result.universalMult < best.universalMult)) {
        best = result;
        best.foundingGap = 0;
        best.openGap = openGap;
      }
    }
    return best;
  }

  function genDeferredAssetAmortization() {
    const asset = pick(DEFERRED_ASSETS);
    let maxYears = asset.maxYears;
    let bondRedemption = null;
    if (asset.dateType === 'bond') {
      bondRedemption = pick([3, 4, 5, 6, 7, 8, 10]);
      maxYears = bondRedemption;
    }
    const showActualYears = Math.random() < 0.5;
    const years = asset.dateType === 'bond' ? bondRedemption : maxYears;
    const limitToUnder3Years = asset.dateType === 'simple' || asset.dateType === 'founding';
    const elapsed = limitToUnder3Years ? randInt(0, Math.min(2, years - 1)) : randInt(0, years - 1);
    const useMidYear = elapsed === 0 && Math.random() < 0.6;

    const useFixedMidYearDate = Math.random() < 0.5;
    const midYearMonth = fixedTrapCalendarMonth();
    const acq = elapsed === 0 && !useMidYear
      ? pastFYStart(0)
      : (elapsed === 0
        ? (useFixedMidYearDate
          ? (function () {
            const d = fyMonthToDate(CURRENT_FY, ((midYearMonth - FY_START_MONTH + 12) % 12) + 1);
            return { year: d.year, month: d.month, fy: CURRENT_FY };
          })()
          : pastDate(0))
        : pastFYStart(elapsed));
    const acqDateStr = elapsed === 0 && useMidYear && !useFixedMidYearDate ? dateStrAnyDay(acq.year, acq.month) : dateStr(acq.year, acq.month);
    const currentPeriodMonths = useMidYear ? (13 - (((acq.month - FY_START_MONTH + 12) % 12) + 1)) : 12;
    const monthMultCommon = 12 / gcd(12, currentPeriodMonths);
    if (asset.dateType === 'founding' && elapsed === 0 && useMidYear && currentPeriodMonths < 2) return genDeferredAssetAmortization();
    if (elapsed === 0 && useMidYear && currentPeriodMonths === 12) return genDeferredAssetAmortization();

    const universalMultCommon = lcm(monthMultCommon, 15);
    const unitCommon = universalMultCommon * 100;
    const totalPerUnitCommon = unitCommon * years;
    const minMultCommon = Math.max(1, Math.ceil(100000 / totalPerUnitCommon));
    const maxMultCommon = Math.max(minMultCommon, Math.floor(9999999 / totalPerUnitCommon));
    const annualBase = randInt(minMultCommon, maxMultCommon) * universalMultCommon;
    const annual = annualBase * 100;
    const totalAmount = annual * years;
    const currentPeriodAnswer = useMidYear ? annual * currentPeriodMonths / 12 : annual;

    if (asset.dateType === 'warrant') {
      if (elapsed === 0) {
        const warrantMonthStep = useMidYear
          ? '<div class="step">' + acqDateStr + 'から当期末までの使用月数は' + currentPeriodMonths + 'か月なので月割計算する</div>' +
            '<div class="step">年間の償却額 = 支出額 ÷ 償却年数</div>' + '<div class="step">' + yen(totalAmount) + ' ÷ ' + years + ' = ' + yen(annual) + '</div>' +
            '<div class="step formula">当期分 = ' + yen(annual) + ' × ' + currentPeriodMonths + ' ÷ 12 = ' + yen(currentPeriodAnswer) + '</div>'
          : '<div class="step">当期首(' + acqDateStr + ')に支出しているため、当期は1年分を償却する</div>' + '<div class="step">当期の償却額 = 支出額 ÷ 償却年数</div>' + '<div class="step formula">' + yen(totalAmount) + ' ÷ ' + years + ' = ' + yen(annual) + '</div>';
        return {
          level: '1', category: '繰延資産(社債発行費等)',
          question: '当社は' + acqDateStr + 'に新株予約権を発行し、発行に伴う費用' + yen(totalAmount) + 'を現金で支払った。繰延資産として計上できるものは繰延資産として計上し、会社法の規定する最長の期間にわたり定額法で償却する。当期(' + fyLabel(CURRENT_FY) + ')の繰延資産の償却額はいくらか。',
          answer: currentPeriodAnswer,
          explain: '<div class="step">新株予約権の発行に伴う費用は「社債発行費等」として繰延資産に計上できる</div>' +
            '<div class="step">社債発行費等の償却期間は会社法の規定により最長' + maxYears + '年であり、今回はその最長期間である' + years + '年間で償却する</div>' +
            warrantMonthStep
        };
      }
      const pastAcqWarrant = buildPastAcquisition(years, elapsed, [5]);
      const unitWarrant = pastAcqWarrant.universalMult * 100;
      const bvPerUnitWarrant = unitWarrant * pastAcqWarrant.remainingMonths / 12;
      const minMultWarrant = Math.max(1, Math.ceil(100000 / bvPerUnitWarrant));
      const maxMultWarrant = Math.max(minMultWarrant, Math.floor(9999999 / bvPerUnitWarrant));
      const annualWarrant = randInt(minMultWarrant, maxMultWarrant) * unitWarrant;
      const totalAmountWarrant = annualWarrant * years;
      const bookValueStart = totalAmountWarrant - annualWarrant * pastAcqWarrant.elapsedMonthsTotal / 12;
      const fyStartWarrant = fyMonthToDate(CURRENT_FY, 1);
      const fyStartAbsWarrant = fyStartWarrant.year * 12 + (fyStartWarrant.month - 1);
      const acqAbsWarrant = fyStartAbsWarrant - pastAcqWarrant.elapsedMonthsTotal;
      const acqYearWarrant = Math.floor(acqAbsWarrant / 12);
      const acqMonthWarrant = acqAbsWarrant - acqYearWarrant * 12 + 1;
      const acqDateStrWarrant = pastAcqWarrant.useMidYearPast && !pastAcqWarrant.useFixedMidYearDatePast ? dateStrAnyDay(acqYearWarrant, acqMonthWarrant) : dateStr(acqYearWarrant, acqMonthWarrant);
      const remainingYears = years - elapsed;
      const warrantPastMonthStep = pastAcqWarrant.useMidYearPast
        ? '<div class="step">発行日から当期首までの経過期間は' + pastAcqWarrant.elapsedMonthsTotal + 'か月であり、残存償却期間は' + (years * 12) + 'か月 − ' + pastAcqWarrant.elapsedMonthsTotal + 'か月 = ' + pastAcqWarrant.remainingMonths + 'か月である</div>' +
          '<div class="step">当期の社債発行費等償却額 = 当期首帳簿価額 ÷ 残存償却期間(月数) × 12か月</div>' + '<div class="step formula">' + yen(bookValueStart) + ' ÷ ' + pastAcqWarrant.remainingMonths + ' × 12 = ' + yen(annualWarrant) + '</div>'
        : '<div class="step">発行から当期首までの経過年数は' + elapsed + '年であり、残存償却年数は' + remainingYears + '年である</div>' +
          '<div class="step">当期の社債発行費等償却額 = 当期首帳簿価額 ÷ 残存償却年数</div>' + '<div class="step formula">' + yen(bookValueStart) + ' ÷ ' + remainingYears + ' = ' + yen(annualWarrant) + '</div>';
      return {
        level: '1', category: '繰延資産(社債発行費等)',
        question: '当社は' + acqDateStrWarrant + 'に新株予約権を発行した。繰延資産は会社法の規定する最長の期間にわたり定額法で償却している。当期首時点の社債発行費等の帳簿価額は' + yen(bookValueStart) + 'であった。当期(' + fyLabel(CURRENT_FY) + ')の社債発行費等償却額はいくらか。',
        answer: annualWarrant,
        explain: '<div class="step">社債発行費等の償却期間は会社法の規定により最長' + maxYears + '年であり、今回はその最長期間である' + years + '年間で償却している</div>' +
          warrantPastMonthStep
      };
    }

    if (asset.dateType === 'simple') {
      if (elapsed === 0) {
        const RD_LABELS = ['新技術の開発', '新製品の開発'];
        const DEV_LABELS = ['新経営組織の採用', '資源の開発', '市場の開拓'];
        const rdLabel = pick(RD_LABELS);
        const devLabel = pick(DEV_LABELS);
        const devUnitAmount = 3 * monthMultCommon * 100;
        const devMinMult = Math.max(1, Math.ceil(100000 / (devUnitAmount * years)));
        const devMaxMult = Math.max(devMinMult, Math.floor(9999999 / (devUnitAmount * years)));
        const annualDev = randInt(devMinMult, devMaxMult) * devUnitAmount;
        const devAmount = annualDev * years;
        const rdUnitAmount = 15 * monthMultCommon * 100;
        const rdTargetMult = Math.max(1, Math.round(devAmount / rdUnitAmount));
        const rdMinMult = Math.max(1, Math.round(rdTargetMult * 0.5), Math.ceil(100000 / rdUnitAmount));
        const rdMaxMult = Math.max(rdMinMult, Math.min(Math.round(rdTargetMult * 2), Math.floor(9999999 / rdUnitAmount)));
        let rdAmount = randInt(rdMinMult, rdMaxMult) * rdUnitAmount;
        if (rdAmount === devAmount) rdAmount += rdUnitAmount;
        const devPeriodAnswer = useMidYear ? annualDev * currentPeriodMonths / 12 : annualDev;
        const rdFirst = Math.random() < 0.5;
        const part1 = rdFirst
          ? rdLabel + 'として' + yen(rdAmount) + ''
          : devLabel + 'として' + yen(devAmount) + '';
        const part2 = rdFirst
          ? devLabel + 'として' + yen(devAmount) + ''
          : rdLabel + 'として' + yen(rdAmount) + '';
        const devMonthStep = useMidYear
          ? '<div class="step">' + acqDateStr + 'から当期末までの使用月数は' + currentPeriodMonths + 'か月なので月割計算する</div>' +
            '<div class="step">年間の償却額 = 支出額 ÷ 償却年数</div>' + '<div class="step">' + yen(devAmount) + ' ÷ ' + years + ' = ' + yen(annualDev) + '</div>' +
            '<div class="step formula">当期分 = ' + yen(annualDev) + ' × ' + currentPeriodMonths + ' ÷ 12 = ' + yen(devPeriodAnswer) + '</div>'
          : '<div class="step">当期首(' + acqDateStr + ')に支出しているため、当期は1年分を償却する</div>' + '<div class="step">当期の償却額 = 支出額 ÷ 償却年数</div>' + '<div class="step formula">' + yen(devAmount) + ' ÷ ' + years + ' = ' + yen(annualDev) + '</div>';

        return {
          level: '1', category: '繰延資産(開発費)',
          question: '当社は' + acqDateStr + 'に' + part1 + '、' + part2 + 'を支出した。繰延資産として計上できるものは繰延資産として計上し、会社法の規定する最長の期間にわたり定額法で償却する。当期(' + fyLabel(CURRENT_FY) + ')の繰延資産の償却額はいくらか。',
          answer: devPeriodAnswer,
          explain: '<div class="step">' + rdLabel + 'のための支出は「研究開発費」に該当し、発生時に全額を費用として処理するため、繰延資産には計上しない</div>' +
            '<div class="step">' + devLabel + 'のための支出は「開発費」に該当し、繰延資産として計上できる</div>' +
            '<div class="step" style="margin-top:16px;">開発費の償却期間は会社法の規定により最長' + maxYears + '年であり、今回はその最長期間である' + years + '年間で償却する</div>' +
            devMonthStep
        };
      }
      const pastAcqDev = buildPastAcquisition(years, elapsed, [3]);
      const unitDevPast = pastAcqDev.universalMult * 100;
      const bvPerUnitDevPast = unitDevPast * pastAcqDev.remainingMonths / 12;
      const minMultDevPast = Math.max(1, Math.ceil(100000 / bvPerUnitDevPast));
      const maxMultDevPast = Math.max(minMultDevPast, Math.floor(9999999 / bvPerUnitDevPast));
      const annualDevPast = randInt(minMultDevPast, maxMultDevPast) * unitDevPast;
      const totalAmountDevPast = annualDevPast * years;
      const bookValueStart = totalAmountDevPast - annualDevPast * pastAcqDev.elapsedMonthsTotal / 12;
      const fyStartDevPast = fyMonthToDate(CURRENT_FY, 1);
      const fyStartAbsDevPast = fyStartDevPast.year * 12 + (fyStartDevPast.month - 1);
      const acqAbsDevPast = fyStartAbsDevPast - pastAcqDev.elapsedMonthsTotal;
      const acqYearDevPast = Math.floor(acqAbsDevPast / 12);
      const acqMonthDevPast = acqAbsDevPast - acqYearDevPast * 12 + 1;
      const acqDateStrDevPast = pastAcqDev.useMidYearPast && !pastAcqDev.useFixedMidYearDatePast ? dateStrAnyDay(acqYearDevPast, acqMonthDevPast) : dateStr(acqYearDevPast, acqMonthDevPast);
      const remainingYears = years - elapsed;
      const devPastMonthStep = pastAcqDev.useMidYearPast
        ? '<div class="step">支出から当期首までの経過期間は' + pastAcqDev.elapsedMonthsTotal + 'か月であり、残存償却期間は' + (years * 12) + 'か月 − ' + pastAcqDev.elapsedMonthsTotal + 'か月 = ' + pastAcqDev.remainingMonths + 'か月である</div>' +
          '<div class="step">当期の償却額 = 当期首帳簿価額 ÷ 残存償却期間(月数) × 12か月</div>' + '<div class="step formula">' + yen(bookValueStart) + ' ÷ ' + pastAcqDev.remainingMonths + ' × 12 = ' + yen(annualDevPast) + '</div>'
        : '<div class="step">支出から当期首までの経過年数は' + elapsed + '年であり、残存償却年数は' + remainingYears + '年である</div>' +
          '<div class="step">当期の償却額 = 当期首帳簿価額 ÷ 残存償却年数</div>' + '<div class="step formula">' + yen(bookValueStart) + ' ÷ ' + remainingYears + ' = ' + yen(annualDevPast) + '</div>';
      return {
        level: '1', category: '繰延資産(開発費)',
        question: '当社は' + acqDateStrDevPast + 'に開発費を支出した。繰延資産は会社法の規定する最長の期間にわたり定額法で償却している。当期首時点の開発費の帳簿価額は' + yen(bookValueStart) + 'であった。当期(' + fyLabel(CURRENT_FY) + ')の繰延資産の償却額はいくらか。',
        answer: annualDevPast,
        explain: '<div class="step">開発費の償却期間は会社法の規定により最長' + maxYears + '年であり、今回はその最長期間である' + years + '年間で償却している</div>' +
          devPastMonthStep
      };
    }

    if (asset.dateType === 'stock') {
      if (elapsed === 0) {
        const stockMonthStep = useMidYear
          ? '<div class="step">' + acqDateStr + 'から当期末までの使用月数は' + currentPeriodMonths + 'か月なので月割計算する</div>' +
            '<div class="step">年間の株式交付費償却額 = 支出額 ÷ 償却年数</div>' + '<div class="step">' + yen(totalAmount) + ' ÷ ' + years + ' = ' + yen(annual) + '</div>' +
            '<div class="step formula">当期分 = ' + yen(annual) + ' × ' + currentPeriodMonths + ' ÷ 12 = ' + yen(currentPeriodAnswer) + '</div>'
          : '<div class="step">当期首(' + acqDateStr + ')に支出しているため、当期は1年分を償却する</div>' + '<div class="step">当期の償却額 = 支出額 ÷ 償却年数</div>' + '<div class="step formula">' + yen(totalAmount) + ' ÷ ' + years + ' = ' + yen(annual) + '</div>';
        return {
          level: '1', category: '繰延資産(株式交付費)',
          question: '当社は' + acqDateStr + 'に新株を発行し、発行に伴う費用' + yen(totalAmount) + 'は現金で支払った。繰延資産として計上できるものは繰延資産として計上し、会社法の規定する最長の期間にわたり定額法で償却する。当期(' + fyLabel(CURRENT_FY) + ')の繰延資産の償却額はいくらか。',
          answer: currentPeriodAnswer,
          explain: '<div class="step">新株発行に伴う費用は「株式交付費」として繰延資産に計上できる</div>' +
            '<div class="step">株式交付費の償却期間は会社法の規定により最長' + maxYears + '年であり、今回はその最長期間である' + years + '年間で償却する</div>' +
            stockMonthStep
        };
      }
      const pastAcqStock = buildPastAcquisition(years, elapsed, [5]);
      const unitStock = pastAcqStock.universalMult * 100;
      const bvPerUnitStock = unitStock * pastAcqStock.remainingMonths / 12;
      const minMultStock = Math.max(1, Math.ceil(100000 / bvPerUnitStock));
      const maxMultStock = Math.max(minMultStock, Math.floor(9999999 / bvPerUnitStock));
      const annualStock = randInt(minMultStock, maxMultStock) * unitStock;
      const totalAmountStock = annualStock * years;
      const bookValueStart = totalAmountStock - annualStock * pastAcqStock.elapsedMonthsTotal / 12;
      const fyStartStock = fyMonthToDate(CURRENT_FY, 1);
      const fyStartAbsStock = fyStartStock.year * 12 + (fyStartStock.month - 1);
      const acqAbsStock = fyStartAbsStock - pastAcqStock.elapsedMonthsTotal;
      const acqYearStock = Math.floor(acqAbsStock / 12);
      const acqMonthStock = acqAbsStock - acqYearStock * 12 + 1;
      const acqDateStrStock = pastAcqStock.useMidYearPast && !pastAcqStock.useFixedMidYearDatePast ? dateStrAnyDay(acqYearStock, acqMonthStock) : dateStr(acqYearStock, acqMonthStock);
      const remainingYears = years - elapsed;
      const stockPastMonthStep = pastAcqStock.useMidYearPast
        ? '<div class="step">発行日から当期首までの経過期間は' + pastAcqStock.elapsedMonthsTotal + 'か月であり、残存償却期間は' + (years * 12) + 'か月 − ' + pastAcqStock.elapsedMonthsTotal + 'か月 = ' + pastAcqStock.remainingMonths + 'か月である</div>' +
          '<div class="step">当期の株式交付費償却額 = 当期首帳簿価額 ÷ 残存償却期間(月数) × 12か月</div>' + '<div class="step formula">' + yen(bookValueStart) + ' ÷ ' + pastAcqStock.remainingMonths + ' × 12 = ' + yen(annualStock) + '</div>'
        : '<div class="step">発行から当期首までの経過年数は' + elapsed + '年であり、残存償却年数は' + remainingYears + '年である</div>' +
          '<div class="step">当期の株式交付費償却額 = 当期首帳簿価額 ÷ 残存償却年数</div>' + '<div class="step formula">' + yen(bookValueStart) + ' ÷ ' + remainingYears + ' = ' + yen(annualStock) + '</div>';
      return {
        level: '1', category: '繰延資産(株式交付費)',
        question: '当社は' + acqDateStrStock + 'に新株を発行した。繰延資産は会社法の規定する最長の期間にわたり定額法で償却している。当期首時点の株式交付費の帳簿価額は' + yen(bookValueStart) + 'であった。当期(' + fyLabel(CURRENT_FY) + ')の株式交付費償却額はいくらか。',
        answer: annualStock,
        explain: '<div class="step">株式交付費の償却期間は会社法の規定により最長' + maxYears + '年であり、今回はその最長期間である' + years + '年間で償却している</div>' +
          stockPastMonthStep
      };
    }

    if (asset.dateType === 'bond') {
      if (elapsed === 0) {
        const bondMonthStep = useMidYear
          ? '<div class="step">' + acqDateStr + 'から当期末までの使用月数は' + currentPeriodMonths + 'か月なので月割計算する</div>' +
            '<div class="step">年間の償却額 = 支出額 ÷ 償却年数</div>' + '<div class="step">' + yen(totalAmount) + ' ÷ ' + years + ' = ' + yen(annual) + '</div>' +
            '<div class="step formula">当期分 = ' + yen(annual) + ' × ' + currentPeriodMonths + ' ÷ 12 = ' + yen(currentPeriodAnswer) + '</div>'
          : '<div class="step">当期首(' + acqDateStr + ')に支出しているため、当期は1年分を償却する</div>' + '<div class="step">当期の償却額 = 支出額 ÷ 償却年数</div>' + '<div class="step formula">' + yen(totalAmount) + ' ÷ ' + years + ' = ' + yen(annual) + '</div>';
        return {
          level: '1', category: '繰延資産(社債発行費等)',
          question: '当社は' + acqDateStr + 'に社債(償還期間' + bondRedemption + '年)を発行した。社債の発行に伴う支出' + yen(totalAmount) + 'は繰延資産として計上し、定額法で償却する。当期(' + fyLabel(CURRENT_FY) + ')の繰延資産の償却額はいくらか。',
          answer: currentPeriodAnswer,
          explain: '<div class="step">社債の発行に伴う支出は「社債発行費等」として繰延資産に計上する</div>' +
            '<div class="step">社債発行費等は、社債の償還期間にわたって定額法で償却するため、償却期間は社債の償還期間と同じ' + years + '年である</div>' +
            bondMonthStep
        };
      }
      const checkWrongYearsBond = years === 3 ? [5] : (years === 5 ? [3] : [3, 5]);
      const pastAcqBond = buildPastAcquisition(years, elapsed, checkWrongYearsBond);
      const unitBond = pastAcqBond.universalMult * 100;
      const bvPerUnit = unitBond * pastAcqBond.remainingMonths / 12;
      const minMultBond = Math.max(1, Math.ceil(100000 / bvPerUnit));
      const maxMultBond = Math.max(minMultBond, Math.floor(9999999 / bvPerUnit));
      const annualBond = randInt(minMultBond, maxMultBond) * unitBond;
      const totalAmountBond = annualBond * years;
      const bookValueStart = totalAmountBond - annualBond * pastAcqBond.elapsedMonthsTotal / 12;
      const fyStartBond = fyMonthToDate(CURRENT_FY, 1);
      const fyStartAbsBond = fyStartBond.year * 12 + (fyStartBond.month - 1);
      const acqAbsBond = fyStartAbsBond - pastAcqBond.elapsedMonthsTotal;
      const acqYearBond = Math.floor(acqAbsBond / 12);
      const acqMonthBond = acqAbsBond - acqYearBond * 12 + 1;
      const acqDateStrBond = pastAcqBond.useMidYearPast && !pastAcqBond.useFixedMidYearDatePast ? dateStrAnyDay(acqYearBond, acqMonthBond) : dateStr(acqYearBond, acqMonthBond);
      const remainingYears = years - elapsed;
      const bondPastMonthStep = pastAcqBond.useMidYearPast
        ? '<div class="step">発行日から当期首までの経過期間は' + pastAcqBond.elapsedMonthsTotal + 'か月であり、残存償却期間は' + (years * 12) + 'か月 − ' + pastAcqBond.elapsedMonthsTotal + 'か月 = ' + pastAcqBond.remainingMonths + 'か月である</div>' +
          '<div class="step">当期の償却額 = 当期首帳簿価額 ÷ 残存償却期間(月数) × 12か月</div>' + '<div class="step formula">' + yen(bookValueStart) + ' ÷ ' + pastAcqBond.remainingMonths + ' × 12 = ' + yen(annualBond) + '</div>'
        : '<div class="step">発行から当期首までの経過年数は' + elapsed + '年であり、残存償却年数は' + remainingYears + '年である</div>' +
          '<div class="step">当期の償却額 = 当期首帳簿価額 ÷ 残存償却年数</div>' + '<div class="step formula">' + yen(bookValueStart) + ' ÷ ' + remainingYears + ' = ' + yen(annualBond) + '</div>';
      return {
        level: '1', category: '繰延資産(社債発行費等)',
        question: '当社は' + acqDateStrBond + 'に社債(償還期間' + bondRedemption + '年)を発行した。繰延資産は会社法の規定する最長の期間にわたり定額法で償却している。当期首時点の社債発行費の帳簿価額は' + yen(bookValueStart) + 'であった。当期(' + fyLabel(CURRENT_FY) + ')の繰延資産の償却額はいくらか。',
        answer: annualBond,
        explain: '<div class="step">社債発行費等は、社債の償還期間にわたって定額法で償却するため、償却期間は社債の償還期間と同じ' + years + '年である</div>' +
          bondPastMonthStep
      };
    }

    if (asset.dateType === 'founding') {
      const effectiveMidYear = elapsed === 0 && useMidYear && currentPeriodMonths >= 2;
      const foundingCurrentPeriodMonths = effectiveMidYear ? currentPeriodMonths : 12;
      const maxGapForFounding = effectiveMidYear ? Math.max(1, Math.min(4, foundingCurrentPeriodMonths - 1)) : 4;
      const openGapMonths = randInt(1, maxGapForFounding);
      const openMonthRaw = acq.month + openGapMonths;
      const openMonth = ((openMonthRaw - 1) % 12) + 1;
      const openYear = acq.year + Math.floor((openMonthRaw - 1) / 12);
      const openDateStr = dateStrAnyDay(openYear, openMonth);
      const askFounding = Math.random() < 0.5;
      const askedLabel = askFounding ? '創立費' : '開業費';

      if (elapsed === 0) {
        const openingCurrentPeriodMonths = effectiveMidYear ? foundingCurrentPeriodMonths - openGapMonths : 12 - openGapMonths;
        const monthMultFounding = 12 / gcd(12, foundingCurrentPeriodMonths);
        const monthMultOpening = 12 / gcd(12, openingCurrentPeriodMonths);
        const universalMonthMult = lcm(monthMultFounding, monthMultOpening);
        const devUnitAmountFounding = 3 * universalMonthMult * 100;
        const devMinMultFounding = Math.max(1, Math.ceil(100000 / (devUnitAmountFounding * years)));
        const devMaxMultFounding = Math.max(devMinMultFounding, Math.floor(9999999 / (devUnitAmountFounding * years)));
        const annualDev = randInt(devMinMultFounding, devMaxMultFounding) * devUnitAmountFounding;
        const totalAmountDev = annualDev * years;
        const otherUnitAmount = 15 * universalMonthMult * 100;
        const otherTargetMult = Math.max(1, Math.round(totalAmountDev / otherUnitAmount));
        const otherMinMultFounding = Math.max(1, Math.round(otherTargetMult * 0.5), Math.ceil(100000 / otherUnitAmount));
        const otherMaxMultFounding = Math.max(otherMinMultFounding, Math.min(Math.round(otherTargetMult * 2), Math.floor(9999999 / otherUnitAmount)));
        let otherAmount = randInt(otherMinMultFounding, otherMaxMultFounding) * otherUnitAmount;
        if (otherAmount === totalAmountDev) otherAmount += otherUnitAmount;
        const foundingAmount = askFounding ? totalAmountDev : otherAmount;
        const openingAmount = askFounding ? otherAmount : totalAmountDev;
        const askedPeriodMonths = askFounding ? foundingCurrentPeriodMonths : openingCurrentPeriodMonths;
        const askedAnswer = (askFounding && !effectiveMidYear) ? annualDev : (annualDev * askedPeriodMonths / 12);
        const foundingProrationNote = effectiveMidYear ? '(会社設立日を基準とするため、初年度は月割計算を行う)' : '';
        const monthProrationStep = (askFounding && !effectiveMidYear)
          ? ''
          : '<div class="step">' + (askFounding ? acqDateStr : openDateStr) + 'から当期末までの使用月数は' + askedPeriodMonths + 'か月なので月割計算する</div>';
        const askedAnswerFormula = (askFounding && !effectiveMidYear)
          ? '<div class="step">当期首(' + acqDateStr + ')に会社を設立しているため、当期は1年分を償却する</div>' + '<div class="step">当期の' + askedLabel + '償却額 = 支出額 ÷ 償却年数</div>' + '<div class="step formula">' + yen(totalAmountDev) + ' ÷ ' + years + ' = ' + yen(annualDev) + '</div>'
          : '<div class="step">年間の' + askedLabel + '償却額 = 支出額 ÷ 償却年数</div>' + '<div class="step">' + yen(totalAmountDev) + ' ÷ ' + years + ' = ' + yen(annualDev) + '</div>' +
            '<div class="step formula">当期分 = ' + yen(annualDev) + ' × ' + askedPeriodMonths + ' ÷ 12 = ' + yen(askedAnswer) + '</div>';
        return {
          level: '1', category: '繰延資産(' + askedLabel + ')',
          question: '当社は' + acqDateStr + 'に会社を設立し、' + openDateStr + 'に営業を開始した。会社設立までの支出は' + yen(foundingAmount) + '、営業開始までの支出は' + yen(openingAmount) + 'であった。繰延資産として計上できるものは繰延資産として計上し、会社法の規定する最長の期間にわたり定額法で償却する。当期(' + fyLabel(CURRENT_FY) + ')の' + askedLabel + '償却額はいくらか。',
          answer: askedAnswer,
          explain: '<div class="step">会社設立までの支出は「創立費」、会社設立後から営業開始までの支出は「開業費」として、それぞれ繰延資産に計上できる</div>' +
            '<div class="step">今回問われているのは' + askedLabel + 'であり、その金額は' + yen(totalAmountDev) + 'である</div>' +
            '<div class="step" style="margin-top:16px;">' + askedLabel + 'の償却期間は会社法の規定により最長' + maxYears + '年であり、今回はその最長期間である' + years + '年間で償却する' + (askFounding ? foundingProrationNote : '') + '</div>' +
            monthProrationStep +
            askedAnswerFormula
        };
      }

      const pastFoundingAcq = buildFoundingPastAcquisition(years, elapsed, [3]);
      const unitFoundingPast = pastFoundingAcq.universalMult * 100;
      const bvPerUnitFounding = unitFoundingPast * pastFoundingAcq.remainingMonthsForFounding / 12;
      const bvPerUnitOpening = unitFoundingPast * pastFoundingAcq.remainingMonthsForOpening / 12;
      const minMultFoundingPast = Math.max(1, Math.ceil(100000 / bvPerUnitFounding), Math.ceil(100000 / bvPerUnitOpening));
      const maxMultFoundingPast = Math.max(minMultFoundingPast, Math.min(Math.floor(9999999 / bvPerUnitFounding), Math.floor(9999999 / bvPerUnitOpening)));
      const annualDeferred = randInt(minMultFoundingPast, maxMultFoundingPast) * unitFoundingPast;
      const totalAmountDeferred = annualDeferred * years;
      const bookValueOpening = totalAmountDeferred - annualDeferred * pastFoundingAcq.elapsedMonthsForOpening / 12;
      const bookValueFounding = totalAmountDeferred - annualDeferred * pastFoundingAcq.elapsedMonthsForFounding / 12;
      const bookValueStartTmp = askFounding ? bookValueFounding : bookValueOpening;
      const otherUnit = pastFoundingAcq.universalMult * 100;
      const otherTargetMult = Math.max(1, Math.round(bookValueStartTmp / otherUnit));
      const otherMinMult = Math.max(1, Math.round(otherTargetMult * 0.5), Math.ceil(100000 / otherUnit));
      const otherMaxMult = Math.max(otherMinMult, Math.min(Math.round(otherTargetMult * 2), Math.floor(9999999 / otherUnit)));
      let otherBookValue = randInt(otherMinMult, otherMaxMult) * otherUnit;
      if (otherBookValue === bookValueStartTmp) otherBookValue += otherUnit;

      const fyStartFoundingPast = fyMonthToDate(CURRENT_FY, 1);
      const fyStartAbsFoundingPast = fyStartFoundingPast.year * 12 + (fyStartFoundingPast.month - 1);
      const acqAbsFoundingPast = fyStartAbsFoundingPast - pastFoundingAcq.elapsedMonthsForFounding;
      const acqYearFoundingPast = Math.floor(acqAbsFoundingPast / 12);
      const acqMonthFoundingPast = acqAbsFoundingPast - acqYearFoundingPast * 12 + 1;
      const acqDateStrFoundingPast = (pastFoundingAcq.foundingGap === 0 || pastFoundingAcq.useFixedMidYearDatePast) ? dateStr(acqYearFoundingPast, acqMonthFoundingPast) : dateStrAnyDay(acqYearFoundingPast, acqMonthFoundingPast);
      const openAbsFoundingPast = fyStartAbsFoundingPast - pastFoundingAcq.elapsedMonthsForOpening;
      const openYearFoundingPast = Math.floor(openAbsFoundingPast / 12);
      const openMonthFoundingPast = openAbsFoundingPast - openYearFoundingPast * 12 + 1;
      const openDateStrFoundingPast = dateStrAnyDay(openYearFoundingPast, openMonthFoundingPast);

      const elapsedMonthsUsed = askFounding ? pastFoundingAcq.elapsedMonthsForFounding : pastFoundingAcq.elapsedMonthsForOpening;
      const remainingMonthsUsed = askFounding ? pastFoundingAcq.remainingMonthsForFounding : pastFoundingAcq.remainingMonthsForOpening;
      const bookValueStart = bookValueStartTmp;
      const foundingBookValue = askFounding ? bookValueStart : otherBookValue;
      const openingBookValue = askFounding ? otherBookValue : bookValueStart;
      const monthProrationNote = (askFounding && pastFoundingAcq.foundingGap === 0) ? '' : '(' + (askFounding ? '会社設立日' : '営業開始日') + 'を基準とするため、初年度は月割計算を行う)';
      return {
        level: '1', category: '繰延資産(' + askedLabel + ')',
        question: '当社は' + acqDateStrFoundingPast + 'に会社を設立し、' + openDateStrFoundingPast + 'に営業を開始した。繰延資産は会社法の規定する最長の期間にわたり定額法で償却している。当期首時点での創立費の帳簿価額は' + yen(foundingBookValue) + '、開業費の帳簿価額は' + yen(openingBookValue) + 'であった。当期(' + fyLabel(CURRENT_FY) + ')の' + askedLabel + '償却額はいくらか。',
        answer: annualDeferred,
        explain: '<div class="step">今回問われているのは' + askedLabel + 'であり、その当期首帳簿価額は' + yen(bookValueStart) + 'である</div>' +
          '<div class="step">' + askedLabel + 'の償却期間は会社法の規定により最長' + maxYears + '年(' + (years * 12) + 'か月)であり、今回はその最長期間である' + years + '年間で償却している' + monthProrationNote + '</div>' +
          '<div class="step" style="margin-top:16px;">' + (askFounding ? '会社設立日' : '営業開始日') + 'から当期首までの経過期間は' + elapsedMonthsUsed + 'か月であり、残存償却期間は' + (years * 12) + 'か月 − ' + elapsedMonthsUsed + 'か月 = ' + remainingMonthsUsed + 'か月である</div>' +
          '<div class="step">当期の' + askedLabel + '償却額 = 当期首帳簿価額 ÷ 残存償却期間(月数) × 12か月</div>' +
          '<div class="step formula">' + yen(bookValueStart) + ' ÷ ' + remainingMonthsUsed + ' × 12 = ' + yen(annualDeferred) + '</div>'
      };
    }

    const periodClause = showActualYears
      ? '会社法の規定する最長期間の範囲内で、' + years + '年間にわたり定額法で償却する'
      : '会社法の規定する最長の期間にわたり定額法で償却する';

    const explainPeriodStep = showActualYears
      ? '<div class="step">今回は' + years + '年間で償却するとの指示があるため、これに従う</div>'
      : '<div class="step">' + asset.name + 'の償却期間は会社法の規定により最長' + maxYears + '年であり、今回はその最長期間である' + years + '年間で償却する</div>';

    return {
      level: '1', category: '繰延資産(' + asset.name + ')',
      question: dateClause + asset.name + '' + yen(totalAmount) + 'について、' + periodClause + '。当期(' + fyLabel(CURRENT_FY) + ')の' + asset.name + '償却額はいくらか。',
      answer: annual,
      explain: explainPeriodStep +
        '<div class="step formula">当期の' + asset.name + '償却額 = ' + yen(totalAmount) + ' ÷ ' + years + ' = ' + yen(annual) + '</div>'
    };
  }

  function adjustBookAssetsForDivisibility(bookAssetsRaw, bookLiabilitiesRaw, consideration, years) {
    const targetResidue = ((-consideration % years) + years) % years;
    for (let delta = 0; delta < years * 100; delta += 100) {
      for (let s = 0; s < 2; s++) {
        const sign = s === 0 ? 1 : -1;
        const candidate = bookAssetsRaw + sign * delta;
        if (candidate <= 0) continue;
        const D = bookLiabilitiesRaw - candidate;
        const residue = ((D % years) + years) % years;
        if (residue === targetResidue) return candidate;
      }
    }
    return bookAssetsRaw;
  }

  function genIntangibleAmortization() {
    const isGoodwill = Math.random() < 0.30;
    const asset = isGoodwill ? INTANGIBLES.find(function (a) { return a.name === 'のれん'; }) : pick(INTANGIBLES.filter(function (a) { return a.name !== 'のれん'; }));
    const years = pick(asset.years);

    if (asset.name === 'のれん') {
      const elapsedYears = 1;
      const [acquirerName, targetName] = pick([['A社', 'B社'], ['甲社', '乙社']]);
      const isNegativeGoodwill = Math.random() < 0.3;

      const priorFYEndMonth = FY_START_MONTH === 4 ? 3 : 12;
      const startOfAcqFY = pastFYStart(elapsedYears);
      const acqEndYear = FY_START_MONTH === 4 ? startOfAcqFY.year : startOfAcqFY.year - 1;
      const acqDateStr = 'X' + acqEndYear + '年' + priorFYEndMonth + '月31日';

      if (isNegativeGoodwill) {
        const acquirerSharePrice = randInt(2, 20) * 100;
        const negativeGoodwillBase = randInt(10, 999);
        const negativeGoodwill = negativeGoodwillBase * 100;
        const targetNetAssetsLow = 500000, targetNetAssetsHigh = 4000000;
        const loShares = Math.max(10, Math.ceil((targetNetAssetsLow - negativeGoodwill) / acquirerSharePrice / 10) * 10);
        const hiShares = Math.max(loShares, Math.floor((targetNetAssetsHigh - negativeGoodwill) / acquirerSharePrice / 10) * 10);
        const sharesIssued = randInt(loShares, hiShares);
        const consideration = acquirerSharePrice * sharesIssued;
        const netAssetsFairValue = consideration + negativeGoodwill;

        const fairLiabilitiesBase = randInt(500, 8000);
        const fairLiabilities = fairLiabilitiesBase * 100;
        const fairAssets = fairLiabilities + netAssetsFairValue;

        const assetPct = randInt(-19, 19);
        const bookAssets = Math.max(100, Math.round(fairAssets * (100 + assetPct) / 100 / 100) * 100);
        const liabPct = randInt(-19, 19);
        const bookLiabilities = Math.max(100, Math.round(fairLiabilities * (100 + liabPct) / 100 / 100) * 100);
        const targetSharePrice = Math.max(100, acquirerSharePrice - randInt(1, Math.max(1, Math.floor(acquirerSharePrice / 100) - 1)) * 100);

        return {
          level: '2', category: '無形固定資産(のれん・企業結合・負ののれん)',
          question: '前期末に' + acquirerName + '(取得企業)は' + targetName + 'を吸収合併し、取得の対価として' + targetName + 'の株主に対して' + acquirerName + '株式' + sharesIssued.toLocaleString('ja-JP') + '株を交付した。企業結合日における' + acquirerName + '株価は' + yen(acquirerSharePrice) + '、' + targetName + '株価は' + yen(targetSharePrice) + 'であった。合併時の' + targetName + 'の資産、負債の帳簿価額は' + yen(bookAssets) + '、' + yen(bookLiabilities) + '、時価は' + yen(fairAssets) + '、' + yen(fairLiabilities) + 'であった。のれんは発生年度の翌期から' + years + '年間にわたり定額法により償却する。当期の' + acquirerName + 'ののれん償却額はいくらか。',
          answer: 0,
          explain: '<div class="step">取得の対価は、交付した' + acquirerName + '株式数 × 企業結合日の' + acquirerName + '株価により算定する(' + targetName + '株価は用いない)</div>' +
            '<div class="step formula">取得対価 = ' + sharesIssued.toLocaleString('ja-JP') + '株 × ' + yen(acquirerSharePrice) + ' = ' + yen(consideration) + '</div>' +
            '<div class="step" style="margin-top:16px;">のれんの算定にあたっては、帳簿価額ではなく時価を用いる</div>' + '<div class="step">' + targetName + 'の時価純資産 = 資産(時価) − 負債(時価)</div>' +
            '<div class="step formula">' + yen(fairAssets) + ' − ' + yen(fairLiabilities) + ' = ' + yen(netAssetsFairValue) + '</div>' +
            '<div class="step" style="margin-top:16px;">取得対価(' + yen(consideration) + ')が時価純資産(' + yen(netAssetsFairValue) + ')を下回っているため、負ののれんが生じている</div>' +
            '<div class="step formula">負ののれん発生益 = ' + yen(netAssetsFairValue) + ' − ' + yen(consideration) + ' = ' + yen(negativeGoodwill) + '</div>' +
            '<div class="step">負ののれんは資産として計上せず、発生した期に「負ののれん発生益」として一括で利益に計上する。償却は行わないため、当期ののれん償却額はゼロである</div>' +
          '<div class="step formula">当期の' + acquirerName + 'ののれん償却額 = ¥0</div>'
        };
      }

      const goodwillLo = Math.max(1, Math.ceil(10 / years));
      const goodwillHi = Math.max(goodwillLo, Math.floor(999 / years));
      const annualBase = randInt(goodwillLo, goodwillHi);
      const annual = annualBase * 100;
      const goodwillAmount = annual * years;

      const acquirerSharePrice = randInt(2, 20) * 100;
      const targetNetAssetsLow = 500000, targetNetAssetsHigh = 4000000;
      const loShares = Math.max(10, Math.ceil((targetNetAssetsLow + 1000) / acquirerSharePrice / 10) * 10);
      const hiShares = Math.max(loShares, Math.floor((targetNetAssetsHigh + 99999) / acquirerSharePrice / 10) * 10);
      const sharesIssued = randInt(loShares, hiShares);
      const consideration = acquirerSharePrice * sharesIssued;
      const netAssetsFairValue = consideration - goodwillAmount;

      const fairLiabilitiesBase = randInt(500, 8000);
      const fairLiabilities = fairLiabilitiesBase * 100;
      const fairAssets = fairLiabilities + netAssetsFairValue;

      const assetPct = randInt(-19, 19);
      const bookAssetsRaw = Math.max(100, Math.round(fairAssets * (100 + assetPct) / 100 / 100) * 100);
      const liabPct = randInt(-19, 19);
      const bookLiabilities = Math.max(100, Math.round(fairLiabilities * (100 + liabPct) / 100 / 100) * 100);
      const bookAssets = adjustBookAssetsForDivisibility(bookAssetsRaw, bookLiabilities, consideration, years);
      const targetSharePrice = Math.max(100, acquirerSharePrice - randInt(1, Math.max(1, Math.floor(acquirerSharePrice / 100) - 1)) * 100);

      return {
        level: '2', category: '無形固定資産(のれん・企業結合)',
        question: '前期末に' + acquirerName + '(取得企業)は' + targetName + 'を吸収合併し、取得の対価として' + targetName + 'の株主に対して' + acquirerName + '株式' + sharesIssued.toLocaleString('ja-JP') + '株を交付した。企業結合日における' + acquirerName + '株価は' + yen(acquirerSharePrice) + '、' + targetName + '株価は' + yen(targetSharePrice) + 'であった。合併時の' + targetName + 'の資産、負債の帳簿価額は' + yen(bookAssets) + '、' + yen(bookLiabilities) + '、時価は' + yen(fairAssets) + '、' + yen(fairLiabilities) + 'であった。のれんは発生年度の翌期から' + years + '年間にわたり定額法により償却する。当期の' + acquirerName + 'ののれん償却額はいくらか。',
        answer: annual,
        explain: '<div class="step">取得の対価は、交付した' + acquirerName + '株式数 × 企業結合日の' + acquirerName + '株価により算定する(' + targetName + '株価は用いない)</div>' +
          '<div class="step formula">取得対価 = ' + sharesIssued.toLocaleString('ja-JP') + '株 × ' + yen(acquirerSharePrice) + ' = ' + yen(consideration) + '</div>' +
          '<div class="step" style="margin-top:16px;">のれんの算定にあたっては、帳簿価額ではなく時価を用いる</div>' + '<div class="step">' + targetName + 'の時価純資産 = 資産(時価) − 負債(時価)</div>' +
          '<div class="step formula">' + yen(fairAssets) + ' − ' + yen(fairLiabilities) + ' = ' + yen(netAssetsFairValue) + '</div>' +
          '<div class="step">のれん = 取得対価 − 時価純資産</div>' + '<div class="step formula">' + yen(consideration) + ' − ' + yen(netAssetsFairValue) + ' = ' + yen(goodwillAmount) + '</div>' +
          '<div class="step" style="margin-top:16px;">のれんは' + years + '年にわたり定額法により償却する</div>' +
          '<div class="step formula">当期の' + acquirerName + 'ののれん償却額 = ' + yen(goodwillAmount) + ' ÷ ' + years + ' = ' + yen(annual) + '</div>'
      };
    }

    const amortLabel = asset.name + '償却';
    const isCurrentPeriod = Math.random() < (30 / 70);
    const elapsed = isCurrentPeriod ? 0 : randInt(1, years - 1);

    if (elapsed === 0) {
      const useMidYear = Math.random() < (25 / 30);
      const useFixedMidYearDate = useMidYear && Math.random() < 0.5;
      const midYearMonth = fixedTrapCalendarMonth();

      let acqYear, acqMonth, currentPeriodMonths;
      if (!useMidYear) {
        const fyStart = fyMonthToDate(CURRENT_FY, 1);
        acqYear = fyStart.year;
        acqMonth = fyStart.month;
        currentPeriodMonths = 12;
      } else if (useFixedMidYearDate) {
        const d = fyMonthToDate(CURRENT_FY, ((midYearMonth - FY_START_MONTH + 12) % 12) + 1);
        acqYear = d.year;
        acqMonth = d.month;
        currentPeriodMonths = 13 - ((((acqMonth - FY_START_MONTH + 12) % 12)) + 1);
      } else {
        const randMonthGap = randInt(1, 11);
        const d = fyMonthToDate(CURRENT_FY, ((randMonthGap) % 12) + 1);
        acqYear = d.year;
        acqMonth = d.month;
        currentPeriodMonths = 13 - ((((acqMonth - FY_START_MONTH + 12) % 12)) + 1);
      }
      const acqDateStr = useMidYear && !useFixedMidYearDate ? dateStrAnyDay(acqYear, acqMonth) : dateStr(acqYear, acqMonth);
      const monthMult = 12 / gcd(12, currentPeriodMonths);
      const annualBase = randInt(200, 3000) * monthMult;
      const annual = annualBase * 100;
      const cost = annual * years;
      const answer = useMidYear ? Math.round(annual * currentPeriodMonths / 12) : annual;

      const monthStep = useMidYear
        ? '<div class="step">取得日から当期末までの使用月数は' + currentPeriodMonths + 'か月なので月割計算する</div>' +
          '<div class="step">年間の' + asset.name + '償却額 = 取得原価 ÷ 償却年数</div>' +
          '<div class="step">' + yen(cost) + ' ÷ ' + years + ' = ' + yen(annual) + '</div>' +
          '<div class="step formula">当期分 = ' + yen(annual) + ' × ' + currentPeriodMonths + ' ÷ 12 = ' + yen(answer) + '</div>'
        : '<div class="step">当期首(' + acqDateStr + ')に取得しているため、当期は1年分を償却する</div>' +
          '<div class="step">当期の' + amortLabel + ' = 取得原価 ÷ 償却年数</div>' +
          '<div class="step formula">' + yen(cost) + ' ÷ ' + years + ' = ' + yen(annual) + '</div>';

      return {
        level: '2', category: useMidYear ? '無形固定資産(月割償却)' : '無形固定資産(均等償却)',
        question: acqDateStr + 'に取得した' + asset.name + '(取得原価 ' + yen(cost) + '、償却年数 ' + years + '年)について、定額法により償却する。当期(' + fyLabel(CURRENT_FY) + ')の' + amortLabel + 'はいくらか。',
        answer,
        explain: monthStep
      };
    }

    const pastAcq = buildPastAcquisition(years, elapsed, [], 25 / 40);
    const annualPastBase = randInt(200, 3000) * pastAcq.universalMult;
    const annualPast = annualPastBase * 100;
    const totalAmountPast = annualPast * years;
    const bookValueStart = totalAmountPast - annualPast * pastAcq.elapsedMonthsTotal / 12;

    const fyStartPast = fyMonthToDate(CURRENT_FY, 1);
    const fyStartAbsPast = fyStartPast.year * 12 + (fyStartPast.month - 1);
    const acqAbsPast = fyStartAbsPast - pastAcq.elapsedMonthsTotal;
    const acqYearPast = Math.floor(acqAbsPast / 12);
    const acqMonthPast = acqAbsPast - acqYearPast * 12 + 1;
    const acqDateStrPast = (!pastAcq.useMidYearPast || pastAcq.useFixedMidYearDatePast) ? dateStr(acqYearPast, acqMonthPast) : dateStrAnyDay(acqYearPast, acqMonthPast);

    return {
      level: '2', category: '無形固定資産(均等償却)', assetCost: totalAmountPast,
      question: acqDateStrPast + 'に取得した' + asset.name + '(償却年数 ' + years + '年)を定額法により償却している。当期首時点の帳簿価額は' + yen(bookValueStart) + 'であった。当期(' + fyLabel(CURRENT_FY) + ')の' + amortLabel + 'はいくらか。',
      answer: annualPast,
      explain: '<div class="step">' + asset.name + 'の償却年数' + years + '年 = ' + (years * 12) + 'か月</div>' +
        '<div class="step">取得日(' + acqDateStrPast + ')から当期首(' + fyStartDateStr(CURRENT_FY) + ')までの経過期間 = ' + elapsedPeriodText(pastAcq.elapsedMonthsTotal) + '</div>' +
        '<div class="step formula">残存償却期間 = ' + (years * 12) + 'か月 − ' + pastAcq.elapsedMonthsTotal + 'か月 = ' + pastAcq.remainingMonths + 'か月(' + ymText(pastAcq.remainingMonths) + ')</div>' +
        '<div class="step" style="margin-top:16px;">当期の' + amortLabel + ' = 期首帳簿価額 ÷ 残存償却期間(月数) × 12か月</div>' +
        '<div class="step formula">' + yen(bookValueStart) + ' ÷ ' + pastAcq.remainingMonths + ' × 12 = ' + yen(annualPast) + '</div>'
    };
  }

  /* ---------- 1級: 市場販売目的のソフトウェア ---------- */
  function genSoftwareAmortization() {
    const usefulLife = 3;

    function genShapePattern() {
      const peakAtYear1 = Math.random() < 0.5;
      if (peakAtYear1) {
        const r1 = 1.0;
        const r2 = 0.45 + Math.random() * 0.35;
        const r3 = r2 * (0.45 + Math.random() * 0.35);
        return [r1, r2, r3];
      } else {
        const r2 = 1.0;
        const r1 = 0.4 + Math.random() * 0.5;
        const r3 = 0.3 + Math.random() * 0.5;
        return [r1, r2, r3];
      }
    }
    function applyShape(shape, min, max, step) {
      const unit = step || 100;
      const scale = randInt(min, max) * 100;
      return shape.map(function (r) {
        return Math.max(100, Math.round(scale * r / unit) * unit);
      });
    }

    let forecastQty, totalForecastQtyBase, actualDiffers, actualSalesQty, wrongDenomQty;
    let forecastRevenueBase, totalForecastRevenueBaseUnit, actualRevDiffers, actualRevenueBase, wrongDenomRev;
    let commonDivisor, cost;
    let outerTries = 0;

    const isYear2 = Math.random() < 0.5;
    // 2年度目の約3割は、当期の実績が残りの見込みの平均を下回り、②(均等配分額)が採用される問題にする
    const wantEqualYear2 = isYear2 && Math.random() < 0.3;

    do {
      const shape = genShapePattern();
      forecastQty = applyShape(shape, 30, 99, 10);
      totalForecastQtyBase = forecastQty.reduce(function (s, q) { return s + q; }, 0);

      const actualBaseIdx = isYear2 ? 1 : 0;
      actualDiffers = wantEqualYear2 || Math.random() < 0.5;
      if (wantEqualYear2) {
        actualSalesQty = Math.max(10, Math.round((forecastQty[1] + forecastQty[2]) / 2 * randInt(70, 95) / 100 / 10) * 10);
      } else if (actualDiffers) {
        const pctChange = randInt(-20, 20);
        actualSalesQty = Math.max(10, Math.round(forecastQty[actualBaseIdx] * (100 + pctChange) / 100 / 10) * 10);
      } else {
        actualSalesQty = forecastQty[actualBaseIdx];
      }
      wrongDenomQty = actualSalesQty + forecastQty[1] + forecastQty[2];

      // 販売単価は年々下がる(2年度目は1年度目の75〜95%、3年度目は2年度目の75〜95%)
      const price2 = randInt(75, 95) / 100;
      const price3 = price2 * randInt(75, 95) / 100;
      const revenueShape = [shape[0], shape[1] * price2, shape[2] * price3];
      forecastRevenueBase = applyShape(revenueShape, 80, 990);
      totalForecastRevenueBaseUnit = forecastRevenueBase.reduce(function (s, r) { return s + r; }, 0);

      actualRevDiffers = wantEqualYear2 || Math.random() < 0.5;
      if (wantEqualYear2) {
        actualRevenueBase = Math.max(10, Math.round((forecastRevenueBase[1] + forecastRevenueBase[2]) / 2 * randInt(70, 95) / 100 / 10) * 10);
      } else if (actualRevDiffers) {
        const pctChangeRev = randInt(-20, 20);
        actualRevenueBase = Math.max(10, Math.round(forecastRevenueBase[actualBaseIdx] * (100 + pctChangeRev) / 100 / 10) * 10);
      } else {
        actualRevenueBase = forecastRevenueBase[actualBaseIdx];
      }
      wrongDenomRev = actualRevenueBase + forecastRevenueBase[1] + forecastRevenueBase[2];

      commonDivisor = lcm(lcm(usefulLife, totalForecastQtyBase), totalForecastRevenueBaseUnit);

      var targetCost = randInt(20, 300) * 10000;
      var costMultiplier = Math.max(1, Math.round(targetCost / commonDivisor));
      cost = commonDivisor * costMultiplier;
      outerTries++;
    } while (
      (cost > 20000000 || cost >= totalForecastRevenueBaseUnit * 100 ||
        (isYear2 && (forecastQty[0] * usefulLife <= totalForecastQtyBase || forecastRevenueBase[0] * usefulLife <= totalForecastRevenueBaseUnit)))
      && outerTries < 3000
    );

    const equalAllocation = cost / usefulLife;
    const perUnitAmount = cost / totalForecastQtyBase;
    const salesMethodAmountByQty = perUnitAmount * actualSalesQty;

    const totalForecastRevenueBase = totalForecastRevenueBaseUnit * 100;
    const forecastRevenue = forecastRevenueBase.map(function (r) { return r * 100; });
    const actualRevenue = actualRevenueBase * 100;
    const perRevenueAmount = cost / totalForecastRevenueBase;
    const salesMethodAmountByRevenue = perRevenueAmount * actualRevenue;

    const useRevenueMethod = Math.random() < 0.5;

    let answer, year1Amortization, bookValueYear2Start, remainingQty, remainingRevenue, year2EqualAllocation, year2SalesMethodAmount, salesMethodAmount;
    if (isYear2) {
      year1Amortization = useRevenueMethod ? perRevenueAmount * forecastRevenue[0] : perUnitAmount * forecastQty[0];
      bookValueYear2Start = cost - year1Amortization;
      remainingQty = forecastQty[1] + forecastQty[2];
      remainingRevenue = forecastRevenue[1] + forecastRevenue[2];
      year2EqualAllocation = bookValueYear2Start / (usefulLife - 1);
      year2SalesMethodAmount = useRevenueMethod ? perRevenueAmount * actualRevenue : perUnitAmount * actualSalesQty;
      answer = Math.max(year2SalesMethodAmount, year2EqualAllocation);
    } else {
      salesMethodAmount = useRevenueMethod ? salesMethodAmountByRevenue : salesMethodAmountByQty;
      answer = Math.max(salesMethodAmount, equalAllocation);
    }


    const usedMultipliers = { };
    usedMultipliers[costMultiplier] = true;
    function pickDistinctMultiplier() {
      const low = Math.max(1, Math.round(costMultiplier * 0.3));
      const high = Math.max(low + 6, Math.round(costMultiplier * 2));
      let m, tries = 0;
      do {
        m = randInt(low, high);
        tries++;
      } while (usedMultipliers[m] && tries < 50);
      usedMultipliers[m] = true;
      return m;
    }
    const rndCost = commonDivisor * pickDistinctMultiplier();
    const majorImprovementCost = commonDivisor * pickDistinctMultiplier();
    const maintenanceCost = commonDivisor * pickDistinctMultiplier();
    const sampleCost = commonDivisor * pickDistinctMultiplier();

    let rows = '';
    forecastQty.forEach(function (q, i) { rows += '<tr><td>' + (i + 1) + '年度</td><td class="je-amt">' + q.toLocaleString('ja-JP') + '個</td><td class="je-amt">' + yen(forecastRevenue[i]) + '</td></tr>'; });

    const costItems = [
      { label: '最初に製品化された製品マスターが完成するまでの費用', value: rndCost, account: '研究開発費', reason: '成果の不確実な研究開発の性格を持つため' },
      { label: '製品マスターの著しい改良に要した費用', value: majorImprovementCost, account: '研究開発費', reason: '新製品の開発と同様の性格を持つため' },
      { label: '製品マスターの機能の改良・強化に要した費用', value: cost, account: 'ソフトウェア(資産)', reason: '将来の収益獲得又は費用削減が確実であるため' },
      { label: '製品マスターの機能を維持するための費用', value: maintenanceCost, account: '修繕費', reason: '将来の収益獲得に直接結びつかないため' },
      { label: '販売促進のための見本品作成費用', value: sampleCost, account: '販売費', reason: 'ソフトウェア自体の費用ではないため' }
    ];
    for (let i = costItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = costItems[i]; costItems[i] = costItems[j]; costItems[j] = tmp;
    }
    const costRows = costItems.map(function (it) { return '<tr><td>' + it.label + '</td><td class="je-amt">' + yen(it.value) + '</td></tr>'; }).join('');
    const judgementRows = costItems.map(function (it) {
      var isAsset = it.account === 'ソフトウェア(資産)';
      var accountColor = isAsset ? 'var(--green-deep)' : 'var(--danger)';
      return '<tr' + (isAsset ? ' class="sj-asset"' : '') + '>' +
        '<td class="sj-label">' + it.label + '<div class="sj-reason">→ ' + it.reason + '</div></td>' +
        '<td class="sj-amt">' + yen(it.value) + '</td>' +
        '<td class="sj-account" style="color:' + accountColor + ';">' + it.account + '</td></tr>';
    }).join('');
    const judgementTable = '<div class="sw-judge-table-wrap"><table class="sw-judge-table"><tr><td class="sj-head">費用の内容</td><td class="sj-head">金額</td><td class="sj-head">勘定科目</td></tr>' + judgementRows + '</table></div>';

    const methodLabel = useRevenueMethod ? '見込販売収益' : '見込販売数量';

    if (isYear2) {
      const year1ActualQtyLabel = forecastQty[0].toLocaleString('ja-JP') + '個';
      const year1ActualRevLabel = yen(forecastRevenue[0]);
      const year2ActualQtyLabel = actualSalesQty.toLocaleString('ja-JP') + '個';
      const year2ActualRevLabel = yen(actualRevenue);
      const year1MethodExplain = useRevenueMethod
        ? '<div class="step">前期(1年度目)の償却額 = 取得原価 × 前期実際販売収益 ÷ 見込販売収益の総額</div>' + '<div class="step">' + yen(cost) + ' × ' + yen(forecastRevenue[0]) + ' ÷ ' + yen(totalForecastRevenueBase) + ' = ' + yen(year1Amortization) + '</div>'
        : '<div class="step">前期(1年度目)の償却額 = 取得原価 × 前期実際販売数量 ÷ 見込販売数量の総数</div>' + '<div class="step">' + yen(cost) + ' × ' + forecastQty[0].toLocaleString('ja-JP') + ' ÷ ' + totalForecastQtyBase.toLocaleString('ja-JP') + ' = ' + yen(year1Amortization) + '</div>';
      const year2SalesExplain = useRevenueMethod
        ? '<div class="step">①見込販売収益に基づく償却額 = 期首帳簿価額 × 当期実際販売収益 ÷ 残存見込販売収益</div>' + '<div class="step">' + yen(bookValueYear2Start) + ' × ' + yen(actualRevenue) + ' ÷ ' + yen(remainingRevenue) + ' = ' + yen(year2SalesMethodAmount) + '</div>'
        : '<div class="step">①見込販売数量に基づく償却額 = 期首帳簿価額 × 当期実際販売数量 ÷ 残存見込販売数量</div>' + '<div class="step">' + yen(bookValueYear2Start) + ' × ' + actualSalesQty.toLocaleString('ja-JP') + ' ÷ ' + remainingQty.toLocaleString('ja-JP') + ' = ' + yen(year2SalesMethodAmount) + '</div>';

      return {
        level: '1', category: 'ソフトウェア(市場販売目的)',
        question: '当社は市場で販売する目的のソフトウェアを開発し、前期首に完成して販売を開始した。開発の過程で生じた費用は次のとおりである。' +
          '<table class="je-table" style="margin-top:10px;"><tr><td style="text-align:center;font-weight:700;">費用の内容</td><td class="je-amt" style="text-align:center;font-weight:700;">金額</td></tr>' + costRows + '</table>' +
          'このソフトウェアの見込有効期間は' + usefulLife + '年であり、各年度の見込販売数量・見込販売収益は次のとおりである。' +
          '<table class="je-table" style="margin-top:10px;"><tr><td style="text-align:center;font-weight:700;">年度</td><td class="je-amt" style="text-align:center;font-weight:700;">見込販売数量</td><td class="je-amt" style="text-align:center;font-weight:700;">見込販売収益</td></tr>' + rows + '</table>' +
          '前期(1年度目)の実際の販売数量は' + year1ActualQtyLabel + '、実際の販売収益は' + year1ActualRevLabel + 'で、いずれも見込みどおりであった。当期(2年度目)の実際の販売数量は' + year2ActualQtyLabel + '、実際の販売収益は' + year2ActualRevLabel + 'であった。' + methodLabel + 'に基づく方法により、当期(2年度目)のソフトウェア償却額を求めなさい。',
        answer: Math.round(answer),
        explain: '<div class="step">支出額を費用処理と資産計上に区別する</div>' +
          judgementTable +
          '<div class="step">まず、前期(1年度目)の償却額を求め、当期首の帳簿価額を計算する</div>' +
          year1MethodExplain +
          '<div class="step formula">当期首(2年度目期首)の帳簿価額 = ' + yen(cost) + ' − ' + yen(year1Amortization) + ' = ' + yen(bookValueYear2Start) + '</div>' +
          '<div class="step" style="margin-top:16px;">当期(2年度目)は、期首帳簿価額をもとに、残存有効期間・残存' + methodLabel + 'を用いて次の①②のいずれか大きい金額を償却額とする</div>' +
          year2SalesExplain +
          '<div class="step">②残存有効期間に基づく均等配分額 = 期首帳簿価額 ÷ 残存有効期間</div>' + '<div class="step">' + yen(bookValueYear2Start) + ' ÷ ' + (usefulLife - 1) + ' = ' + yen(year2EqualAllocation) + '</div>' +
          '<div class="step" style="margin-top:16px;">①と②を比較すると、' + (year2SalesMethodAmount >= year2EqualAllocation ? '①' : '②') + 'のほうが大きいため、これを当期の償却額とする</div>' +
          '<div class="step formula">当期(2年度目)のソフトウェア償却額 = ' + yen(Math.round(answer)) + '</div>'
      };
    }

    const salesMethodExplain = useRevenueMethod
      ? '<div class="step">①見込販売収益に基づく償却額 = 取得原価 × 当期実際販売収益 ÷ 見込販売収益の総額</div>' + '<div class="step">' + yen(cost) + ' × ' + yen(actualRevenue) + ' ÷ ' + yen(totalForecastRevenueBase) + ' = ' + yen(salesMethodAmount) + '</div>'
      : '<div class="step">①見込販売数量に基づく償却額 = 取得原価 × 当期実際販売数量 ÷ 見込販売数量の総数</div>' + '<div class="step">' + yen(cost) + ' × ' + actualSalesQty.toLocaleString('ja-JP') + ' ÷ ' + totalForecastQtyBase.toLocaleString('ja-JP') + ' = ' + yen(salesMethodAmount) + '</div>';

    return {
      level: '1', category: 'ソフトウェア(市場販売目的)',
      question: '当社は市場で販売する目的のソフトウェアを開発し、当期首に完成して販売を開始した。開発の過程で生じた費用は次のとおりである。' +
        '<table class="je-table" style="margin-top:10px;"><tr><td style="text-align:center;font-weight:700;">費用の内容</td><td class="je-amt" style="text-align:center;font-weight:700;">金額</td></tr>' + costRows + '</table>' +
        'このソフトウェアの見込有効期間は' + usefulLife + '年であり、各年度の見込販売数量・見込販売収益は次のとおりである。' +
        '<table class="je-table" style="margin-top:10px;"><tr><td style="text-align:center;font-weight:700;">年度</td><td class="je-amt" style="text-align:center;font-weight:700;">見込販売数量</td><td class="je-amt" style="text-align:center;font-weight:700;">見込販売収益</td></tr>' + rows + '</table>' +
        '当期(1年度目)の実際の販売数量は' + actualSalesQty.toLocaleString('ja-JP') + '個、実際の販売収益は' + yen(actualRevenue) + 'であった。' + methodLabel + 'に基づく方法により、当期のソフトウェア償却額を求めなさい。',
      answer: Math.round(answer),
      explain: '<div class="step">支出額を費用処理と資産計上に区別する</div>' +
        judgementTable +
        '<div class="step">市場販売目的のソフトウェアは、次の①②のいずれか大きい金額を当期の償却額とする</div>' +
        salesMethodExplain +
        '<div class="step">②残存有効期間に基づく均等配分額 = 取得原価 ÷ 残存有効期間(1年度目は見込有効期間と同じ' + usefulLife + '年)</div>' + '<div class="step">' + yen(cost) + ' ÷ ' + usefulLife + ' = ' + yen(equalAllocation) + '</div>' +
        '<div class="step" style="margin-top:16px;">①と②を比較すると、' + (salesMethodAmount >= equalAllocation ? '①' : '②') + 'のほうが大きいため、これを当期の償却額とする</div>' +
        '<div class="step formula">当期のソフトウェア償却額 = ' + yen(Math.round(answer)) + '</div>'
    };
  }

  /* ---------- 2級: 推定問題 ---------- */
  function genEstimateFromBookValue() {
    if (Math.random() < 0.3) return genEstimateFinalYear();
    const item = pick(ITEMS_TANGIBLE);
    const years = yearsForItem(item, [5, 6, 8, 10]);
    const totalMonths = years * 12;

    const fyStart = fyMonthToDate(CURRENT_FY, 1);
    const fyStartAbs = fyStart.year * 12 + (fyStart.month - 1);

    const useFixedMidYearDate = Math.random() < 0.4;
    const minR = Math.max(13, totalMonths - 100);
    const maxR = totalMonths - 1;
    const minE = totalMonths - maxR;
    const maxE = totalMonths - minR;
    let elapsedMonths;
    if (useFixedMidYearDate) {
      const offsetChoice = pick([3, 9]);
      const targetCalMonth = ((FY_START_MONTH - 1 + offsetChoice) % 12) + 1;
      let baseE = -1;
      for (let e0 = 0; e0 < 12; e0++) {
        const acqAbs0 = fyStartAbs - e0;
        const acqYear0 = Math.floor(acqAbs0 / 12);
        const acqMonth0 = acqAbs0 - acqYear0 * 12 + 1;
        if (acqMonth0 === targetCalMonth) { baseE = e0; break; }
      }
      const candidates = [];
      for (let e = baseE; e <= maxE; e += 12) { if (e >= minE) candidates.push(e); }
      elapsedMonths = candidates.length ? pick(candidates) : randInt(minE, maxE);
    } else {
      elapsedMonths = randInt(minE, maxE);
    }
    const remainingMonths = totalMonths - elapsedMonths;
    const residualRate = Math.random() < 0.4 ? 0.1 : 0;

    let answer, bookValueStart, residual;
    if (residualRate === 0) {
      const g = gcd(12, remainingMonths);
      const mult = 12 / g;
      let answerBase;
      if (item === '建物') {
        const lo = Math.max(1, Math.ceil(1000000 * 12 / remainingMonths / 100 / mult));
        const hi = Math.max(lo, Math.floor(2000000000 * 12 / remainingMonths / 100 / mult));
        answerBase = mult * randInt(lo, hi);
      } else {
        answerBase = mult * randInt(100, 1500);
      }
      answer = answerBase * 100;
      bookValueStart = answer * remainingMonths / 12;
      residual = 0;
    } else {
      const denom1 = 4 * years + 3 * remainingMonths;
      const g1 = gcd(denom1, 36);
      const req1 = 36 / g1;
      const g2 = gcd(years, 9);
      const req2 = 9 / g2;
      const reqDivisor = lcm(req1, req2);
      let annualBase;
      if (item === '建物') {
        const lo = Math.max(1, Math.ceil(1000000 * 36 / denom1 / 100 / reqDivisor));
        const hi = Math.max(lo, Math.floor(2000000000 * 36 / denom1 / 100 / reqDivisor));
        annualBase = reqDivisor * randInt(lo, hi);
      } else {
        annualBase = reqDivisor * randInt(50, 800);
      }
      answer = annualBase * 100;
      bookValueStart = answer * denom1 / 36;
      residual = answer * years / 9;
    }

    const acqAbs = fyStartAbs - elapsedMonths;
    const acqYear = Math.floor(acqAbs / 12);
    const acqMonth = acqAbs - acqYear * 12 + 1;
    const acqDateStr = useFixedMidYearDate ? dateStr(acqYear, acqMonth) : dateStrAnyDay(acqYear, acqMonth);

    const originalCostX = residual * 10;

    const explainSteps = residualRate === 0
      ? '<div class="step" style="margin-top:16px;">当期の減価償却費 = 期首帳簿価額 ÷ 残存耐用年数(月数) × 12か月</div>' + '<div class="step formula">' + yen(bookValueStart) + ' ÷ ' + remainingMonths + ' × 12 = ' + yen(answer) + '</div>'
      : '<div class="step" style="margin-top:16px;">取得原価をxとおくと、要償却額 = x − 0.1x = 0.9x</div>' +
        '<div class="step">期首帳簿価額 = 取得原価 − 要償却額 ÷ 耐用年数 ÷ 12か月 × 経過月数</div>' +
        '<div class="step">x − (0.9x ÷ ' + years + ' ÷ 12 × ' + elapsedMonths + ') = ' + yen(bookValueStart) + '</div>' +
        '<div class="step formula">x(取得原価) = ' + yen(originalCostX) + '</div>' +
        '<div class="step" style="margin-top:16px;">当期の減価償却費 = (取得原価 − 残存価額) ÷ 耐用年数</div>' +
        '<div class="step formula">(' + yen(originalCostX) + ' − ' + yen(residual) + ') ÷ ' + years + ' = ' + yen(answer) + '</div>';

    return {
      level: '2', category: '推定問題(期首帳簿価額から)', assetCost: Math.round(answer * years / (residualRate === 0 ? 1 : 0.9)),
      question: acqDateStr + 'に取得した' + item + 'を、定額法(' + residualText(residualRate) + '、耐用年数 ' + years + '年)により減価償却している。当期首時点の帳簿価額は' + yen(bookValueStart) + 'であった。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費はいくらか。',
      answer,
      explain: '<div class="step">耐用年数' + years + '年 = ' + totalMonths + 'か月</div>' +
        '<div class="step">取得日(' + acqDateStr + ')から当期首(' + fyStartDateStr(CURRENT_FY) + ')までの経過期間 = ' + elapsedPeriodText(elapsedMonths) + '</div>' +
        '<div class="step formula">残存耐用年数 = ' + totalMonths + 'か月 − ' + elapsedMonths + 'か月 = ' + remainingMonths + 'か月(' + ymText(remainingMonths) + ')</div>' +
        explainSteps
    };
  }

  /* ---------- 2級: 推定問題(償却最終年度) ---------- */
  function genEstimateFinalYear() {
    const item = pick(['備品', '車両運搬具', '機械装置']);
    const years = pick([5, 6, 8, 10]);
    const totalMonths = years * 12;
    const useTenPercent = Math.random() < 0.4;
    const isFinal = useTenPercent ? true : Math.random() < 0.6;
    const atFYStart = Math.random() < 0.25;
    // 当期首時点の残り月数(最終年度:1〜12か月 / 1年度前:13〜24か月)
    const lastPart = atFYStart ? 12 : randInt(1, 11);
    const remainingMonths = isFinal ? lastPart : lastPart + 12;
    const elapsedMonths = totalMonths - remainingMonths;
    const g = gcd(12, lastPart);
    const mult = 12 / g;

    let annual, bookValueStart, residual = 0, originalCostX = 0, answer;
    if (useTenPercent) {
      const m = randInt(Math.ceil(80 / mult), Math.floor(1200 / mult));
      originalCostX = 1000 * years * mult * m;
      residual = originalCostX / 10;
      annual = 900 * mult * m;
      bookValueStart = residual + annual * remainingMonths / 12;
      answer = bookValueStart - residual;
    } else {
      annual = mult * randInt(Math.ceil(600 / mult), Math.floor(9000 / mult)) * 100;
      bookValueStart = annual * remainingMonths / 12;
      answer = isFinal ? bookValueStart - 1 : annual;
    }

    const fyStart = fyMonthToDate(CURRENT_FY, 1);
    const fyStartAbs = fyStart.year * 12 + (fyStart.month - 1);
    const acqAbs = fyStartAbs - elapsedMonths;
    const acqYear = Math.floor(acqAbs / 12);
    const acqMonth = acqAbs - acqYear * 12 + 1;
    const acqDateStr = (atFYStart || Math.random() < 0.4) ? dateStr(acqYear, acqMonth) : dateStrAnyDay(acqYear, acqMonth);

    const topSteps = '<div class="step">耐用年数' + years + '年 = ' + totalMonths + 'か月</div>' +
      '<div class="step">取得日(' + acqDateStr + ')から当期首(' + fyStartDateStr(CURRENT_FY) + ')までの経過期間 = ' + elapsedPeriodText(elapsedMonths) + '</div>' +
      '<div class="step formula">残存耐用年数 = ' + totalMonths + 'か月 − ' + elapsedMonths + 'か月 = ' + remainingMonths + 'か月' + (remainingMonths >= 12 ? '(' + ymText(remainingMonths) + ')' : '') + '</div>';

    let resultSteps;
    if (useTenPercent) {
      resultSteps =
        '<div class="step">当期中に耐用年数が到来するため、当期が償却最終年度となる</div>' +
        '<div class="step" style="margin-top:16px;">取得原価をxとおくと、要償却額 = x − 0.1x = 0.9x</div>' +
        '<div class="step">期首帳簿価額 = 取得原価 − 要償却額 ÷ 耐用年数 ÷ 12か月 × 経過月数</div>' +
        '<div class="step">x − (0.9x ÷ ' + years + ' ÷ 12 × ' + elapsedMonths + ') = ' + yen(bookValueStart) + '</div>' +
        '<div class="step formula">x(取得原価) = ' + yen(originalCostX) + '</div>' +
        '<div class="step">残存価額 = ' + yen(originalCostX) + ' × 10% = ' + yen(residual) + '</div>' +
        '<div class="step" style="margin-top:16px;">償却最終年度は、帳簿価額が残存価額になるまで償却する</div>' +
        '<div class="step">当期の減価償却費 = 期首帳簿価額 − 残存価額</div>' +
        '<div class="step formula">' + yen(bookValueStart) + ' − ' + yen(residual) + ' = ' + yen(answer) + '</div>';
    } else if (isFinal) {
      resultSteps =
        '<div class="step">当期中に耐用年数が到来するため、当期が償却最終年度となる</div>' +
        '<div class="step" style="margin-top:16px;">償却最終年度は、備忘価額1円を残して帳簿価額の全額を償却する</div>' +
        '<div class="step">当期の減価償却費 = 期首帳簿価額 − 備忘価額</div>' +
        '<div class="step formula">' + yen(bookValueStart) + ' − ¥1 = ' + yen(answer) + '</div>';
    } else {
      resultSteps =
        '<div class="step">当期末時点でも耐用年数が残っている(残り' + ymText(remainingMonths - 12) + ')ため、当期は償却最終年度ではない</div>' +
        '<div class="step" style="margin-top:16px;">備忘価額1円を残す処理は償却最終年度に行うため、当期は通常どおり1年分の減価償却費を計上する</div>' +
        '<div class="step">当期の減価償却費 = 期首帳簿価額 ÷ 残存耐用年数(月数) × 12か月</div>' +
        '<div class="step formula">' + yen(bookValueStart) + ' ÷ ' + remainingMonths + ' × 12 = ' + yen(answer) + '</div>';
    }

    return {
      level: '2', category: useTenPercent ? '推定問題(償却最終年度・残存価額10%)' : '推定問題(償却最終年度・備忘価額)', assetCost: useTenPercent ? originalCostX : annual * years,
      question: acqDateStr + 'に取得した' + item + 'を、定額法(' + (useTenPercent ? '残存価額は取得原価の10%' : '残存価額はゼロ') + '、耐用年数 ' + years + '年)により減価償却している。当期首時点の帳簿価額は' + yen(bookValueStart) + 'であった。' + (useTenPercent ? '' : 'なお、耐用年数の経過時には備忘価額1円を残して償却するものとする。') + '当期(' + fyLabel(CURRENT_FY) + ')の減価償却費はいくらか。',
      answer,
      explain: topSteps + resultSteps
    };
  }

  /* ---------- 2級: リース資産 ---------- */
  function genLeaseAsset() {
    const leaseYears = pick([3, 4, 5, 6, 7]);
    const useInterestExcluded = Math.random() < 0.5;
    const acqPeriod0 = determineAcqPeriod(0.5, 0);
    const useFYStart = acqPeriod0.useFYStart;
    let pf = { months: acqPeriod0.months, multipleNeeded: acqPeriod0.multipleNeeded }, monthFactor = acqPeriod0.multipleNeeded;

    let annual, months, answer, annualPayment, totalLeasePayments, cost;
    if (useInterestExcluded) {
      const cashAnnualBaseUnit = randInt(200, 900);
      const cashAnnualBase = cashAnnualBaseUnit * monthFactor;
      const cashAnnual = cashAnnualBase * 100;
      const pctExtra = randInt(5, 20);
      annualPayment = Math.round(cashAnnual * (100 + pctExtra) / 100 / 1000) * 1000;
      cost = cashAnnual * leaseYears;
      annual = cashAnnual;
    } else {
      const annualBaseUnit = randInt(200, 900);
      const annualBase = annualBaseUnit * monthFactor;
      annualPayment = annualBase * 100;
      cost = annualPayment * leaseYears;
      annual = annualPayment;
    }
    totalLeasePayments = annualPayment * leaseYears;

    if (!useFYStart) {
      months = pf.months;
      answer = annual * months / 12;
    } else {
      answer = annual;
    }

    let acqDateStr, acqMonth;
    if (useFYStart) {
      const d = fyMonthToDate(CURRENT_FY, 1);
      acqDateStr = dateStr(d.year, d.month);
      acqMonth = d.month;
    } else {
      const fyMonth = 13 - months;
      const d = fyMonthToDate(CURRENT_FY, fyMonth);
      acqDateStr = dateStr(d.year, d.month);
      acqMonth = d.month;
    }

    const paymentDateLabel = '年1回後払い';
    const displayedCashPricePct = randInt(105, 120);
    const displayedCashPrice = useInterestExcluded ? cost : Math.round(cost * 100 / displayedCashPricePct / 1000) * 1000;

    const sameAsPaymentNote = useInterestExcluded ? '' : '<div class="step">利子込み法では、リース資産の計上額 ÷ リース期間 = 年間リース料となるため、1年分の減価償却費は年間リース料と同額になる</div>';
    const proRateSteps = useFYStart
      ? '<div class="step" style="margin-top:16px;">当期首(' + acqDateStr + ')に取得しているため、当期は1年分の減価償却費を計上する</div>' +
        sameAsPaymentNote +
        '<div class="step">当期の減価償却費 = リース資産の計上額 ÷ リース期間</div>' +
        '<div class="step formula">' + yen(cost) + ' ÷ ' + leaseYears + '年 = ' + yen(answer) + '</div>'
      : '<div class="step" style="margin-top:16px;">取得日から当期末までの使用月数は' + months + 'か月なので月割計算する</div>' +
        sameAsPaymentNote +
        '<div class="step">年間の減価償却費 = リース資産の計上額 ÷ リース期間</div>' +
        '<div class="step">' + yen(cost) + ' ÷ ' + leaseYears + '年 = ' + yen(annual) + '</div>' +
        '<div class="step formula">当期分 = ' + yen(annual) + ' × ' + months + ' ÷ 12 = ' + yen(answer) + '</div>';

    const costBasisExplain = useInterestExcluded
      ? '<div class="step" style="margin-top:16px;">利子抜き法では、見積現金購入価額をリース資産の計上額とする(リース料総額に含まれる利息相当額は資産計上しない)</div>' +
        '<div class="step formula">リース資産の計上額 = 見積現金購入価額 = ' + yen(cost) + '</div>'
      : '<div class="step">リース料総額 = 年間リース料 × リース期間</div>' +
        '<div class="step">' + yen(annualPayment) + ' × ' + leaseYears + '年 = ' + yen(totalLeasePayments) + '</div>' +
        '<div class="step" style="margin-top:16px;">利子込み法では、リース料総額をそのままリース資産の計上額とする</div>' +
        '<div class="step formula">リース資産の計上額 = リース料総額 = ' + yen(cost) + '</div>';

    return {
      level: '2', category: 'リース資産(所有権移転外・' + (useInterestExcluded ? '利子抜き法' : '利子込み法') + ')',
      question: '当社は' + acqDateStr + 'に、所有権移転外ファイナンス・リース取引によりリース資産を取得した。リース期間は' + leaseYears + '年、年間リース料は' + yen(annualPayment) + '(' + paymentDateLabel + ')、見積現金購入価額は' + yen(displayedCashPrice) + 'であった。' + (useInterestExcluded ? '利子抜き法' : '利子込み法') + 'により、残存価額ゼロ・定額法で減価償却する場合、当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。',
      answer,
      explain: '<div class="step">所有権移転外ファイナンス・リースは、リース期間を耐用年数、残存価額ゼロとして減価償却する</div>' +
        costBasisExplain +
        proRateSteps
    };
  }

  /* ---------- 3級: 付随費用 ---------- */
  // 取得原価 = 購入代価 + 付随費用。扱いが分かれる税金は問題文で処理を明記し、付随費用ではない支出(保険料)も混ぜる
  const INCIDENTAL_ITEMS = {
    '備品': ['引取運賃', '据付費', '購入手数料'],
    '機械装置': ['引取運賃', '据付費', '試運転費', '購入手数料'],
    '建物': ['仲介手数料', '登記料']
  };
  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const k = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[k]; a[k] = t;
    }
    return a;
  }
  function genIncidentalCosts() {
    const item = pick(['備品', '機械装置', '建物', '建物']);
    const isBuilding = item === '建物';
    const years = yearsForItem(item, YEARS);
    const residualRate = pickResidualRate();
    const acq = determineAcqPeriod(0.4, 0.4); // 期首取得40%・期中取得60%
    const useFYStart = acq.useFYStart, months = acq.months;
    // すべての金額を「この単位の倍数」にそろえると、どの項目を誤って含めても(含め忘れても)答えが整数になる
    const intUnit = (residualRate === 0 ? 1 : 10) * years * acq.multipleNeeded;
    const itemUnit = lcm(intUnit, 100), priceUnit = lcm(intUnit, 10000);
    const roundU = function (v) { return Math.max(itemUnit, Math.round(v / itemUnit) * itemUnit); };
    const priceLow = isBuilding ? 5000000 : 550000, priceHigh = isBuilding ? 300000000 : 5500000;
    const pLo = Math.ceil(priceLow / priceUnit);
    const pHi = Math.max(pLo, Math.floor(priceHigh / priceUnit));
    const price = priceUnit * randInt(pLo, pHi);

    // 扱いが分かれる項目(建物のみ):取得原価に含めるかどうかを問題文で明記する
    let taxName = null, taxIncluded = false;
    if (isBuilding && Math.random() < 0.75) {
      taxName = pick(['不動産取得税', '登録免許税']);
      taxIncluded = Math.random() < 0.5;
    }
    // 必ず取得原価に含める付随費用(登録免許税を出すときは、内容が重なる登記料を出さない)
    const candidates = INCIDENTAL_ITEMS[item].filter(function (n) { return !(taxName === '登録免許税' && n === '登記料'); });
    const incCount = Math.min(candidates.length, randInt(1, isBuilding ? 2 : 3));
    const incNames = shuffled(candidates).slice(0, incCount);
    // 付随費用ではない支出(取得原価に含めない)
    const hasInsurance = Math.random() < 0.6;

    const inCost = incNames.map(function (n) { return { name: n, amount: roundU(price * randInt(10, 40) / 1000), kind: 'inc' }; });
    if (taxName && taxIncluded) inCost.push({ name: taxName, amount: roundU(price * randInt(15, 40) / 1000), kind: 'tax' });
    const others = [];
    if (taxName && !taxIncluded) others.push({ name: taxName, amount: roundU(price * randInt(15, 40) / 1000), kind: 'tax' });
    const insName = '1年分の火災保険料';
    if (hasInsurance) others.push({ name: insName, amount: roundU(price * (isBuilding ? randInt(1, 5) : randInt(8, 25)) / 1000), kind: 'ins' });
    const cost = price + inCost.reduce(function (s, x) { return s + x.amount; }, 0);
    const residual = residualRate === 0 ? 0 : cost / 10;
    const annual = (cost - residual) / years;
    const answer = useFYStart ? annual : annual * months / 12;
    const listed = shuffled(inCost.concat(others));

    let acqDateStr;
    if (useFYStart) {
      const d = fyMonthToDate(CURRENT_FY, 1);
      acqDateStr = dateStr(d.year, d.month);
    } else {
      const d = fyMonthToDate(CURRENT_FY, 13 - months);
      acqDateStr = acq.useFixedMidYearDate ? dateStr(d.year, d.month) : dateStrAnyDay(d.year, d.month);
    }

    const question = '当社は' + acqDateStr + 'に' + item + 'を購入し、購入代価 ' + yen(price) + 'のほか、' +
      listed.map(function (x) { return x.name + ' ' + yen(x.amount); }).join('、') + 'を支払った。' +
      (taxName ? 'なお、' + taxName + 'は' + (taxIncluded ? '取得原価に含めて処理する' : '租税公課として費用処理する') + '。' : '') +
      'この' + item + '(' + residualText(residualRate) + '、耐用年数 ' + years + '年)を定額法により減価償却する場合、当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。';

    const inListed = listed.filter(function (x) { return inCost.indexOf(x) >= 0; });
    const costExplain = '<div class="step">固定資産の取得原価は、購入代価に付随費用(固定資産を使用できる状態にするまでにかかった費用)を加えた金額とする</div>' +
      (taxName ? '<div class="step">' + taxName + 'は、問題文の指示により' + (taxIncluded ? '取得原価に含める' : '租税公課として費用処理するため、取得原価に含めない') + '</div>' : '') +
      (hasInsurance ? '<div class="step">火災保険料は、固定資産を使用できる状態にするための費用ではないため、取得原価に含めない(支払保険料として費用処理する)</div>' : '') +
      '<div class="step">取得原価 = 購入代価 + ' + inListed.map(function (x) { return x.name; }).join(' + ') + '</div>' +
      '<div class="step formula">' + yen(price) + ' + ' + inListed.map(function (x) { return yen(x.amount); }).join(' + ') + ' = ' + yen(cost) + '</div>';
    const depExplain = useFYStart
      ? '<div class="step" style="margin-top:16px;">当期首(' + acqDateStr + ')に取得しているため、当期は1年分の減価償却費を計上する</div>' +
        straightAnnualSteps(cost, residual, years, null, annual, true)
      : '<div class="step" style="margin-top:16px;">取得日から当期末までの使用月数は' + months + 'か月なので月割計算する</div>' +
        straightAnnualSteps(cost, residual, years, null, annual, false) +
        '<div class="step formula">当期分 = ' + yen(annual) + ' × ' + months + ' ÷ 12 = ' + yen(answer) + '</div>';

    return {
      level: '3', category: '付随費用(' + (useFYStart ? '年間' : '月割') + ')',
      assetCost: cost,
      question: question,
      answer: answer,
      explain: costExplain + depExplain
    };
  }

  /* ---------- 2級: 割賦購入 ---------- */
  // 現金正価を示す形(showCash)と、支払総額・利息相当額から取得原価を求める形の2パターン
  function genInstallmentPurchase() {
    const item = pick(ITEMS_DECLINING_OK);
    const years = pick(YEARS);
    const residualRate = pickResidualRate();
    const acq = determineAcqPeriod(0.4, 0.4);
    const useFYStart = acq.useFYStart, months = acq.months;
    const factor = residualRate === 0 ? acq.multipleNeeded : lcm(acq.multipleNeeded, 9);
    const unit = years * 100 * factor;
    const lo = Math.max(1, Math.ceil(MIN_ASSET_AMOUNT / unit));
    const hi = Math.max(lo + 3, Math.floor(6000000 / unit));
    const annual = factor * randInt(lo, hi) * 100;
    const dep = annual * years;
    const { cost, residual } = buildCostFromDep(dep, residualRate);
    const answer = useFYStart ? annual : annual * months / 12;

    // 支払条件(毎月払い)。利息相当額は現金正価のおよそ3〜12%
    const count = pick([6, 10, 12, 18, 20, 24]);
    const pct = randInt(3, 12);
    // 支払総額が下の単位の倍数になるよう1回あたりの支払額の刻みを決める(利息込みで誤って計算しても答えが整数になる)
    const intUnit = (residualRate === 0 ? 1 : 10) * years * acq.multipleNeeded;
    const instUnit = lcm(100, intUnit / gcd(intUnit, count));
    const installment = Math.max(instUnit, Math.round(cost * (100 + pct) / 100 / count / instUnit) * instUnit);
    const total = installment * count;
    const interest = total - cost;

    let acqDateStr;
    if (useFYStart) {
      const d = fyMonthToDate(CURRENT_FY, 1);
      acqDateStr = dateStr(d.year, d.month);
    } else {
      const d = fyMonthToDate(CURRENT_FY, 13 - months);
      acqDateStr = acq.useFixedMidYearDate ? dateStr(d.year, d.month) : dateStrAnyDay(d.year, d.month);
    }

    const showCash = Math.random() < 0.5;          // 現金正価を示す
    const showTotal = showCash || Math.random() < 0.5;  // 支払総額を示す(現金正価を示す形では必ず示して引っ掛けにする)
    const payByNote = Math.random() < 0.4;         // 約束手形の振出しによる支払い
    const totalLabel = payByNote ? '額面総額' : '支払総額';

    let payText;
    if (payByNote) {
      payText = '代金は、毎月末に支払期日が到来する額面' + yen(installment) + 'の約束手形' + count + '枚' +
        (showTotal ? '(額面総額' + yen(total) + (showCash ? '' : '、うち利息相当額' + yen(interest)) + ')' : '') + 'を振り出して支払った。' +
        (!showCash && !showTotal ? 'なお、手形の額面総額には利息相当額' + yen(interest) + 'が含まれている。' : '');
    } else {
      payText = '代金は、毎月末に' + yen(installment) + 'ずつ' + count + '回の分割で支払う' +
        (showTotal ? '(支払総額' + yen(total) + (showCash ? '' : '、うち利息相当額' + yen(interest)) + ')' : '') + '。' +
        (!showCash && !showTotal ? 'なお、支払総額には利息相当額' + yen(interest) + 'が含まれている。' : '');
    }

    const question = '当社は' + acqDateStr + 'に、' + item + (showCash ? '(現金正価 ' + yen(cost) + ')' : '') + 'を割賦契約により購入した。' +
      payText + 'この' + item + '(' + residualText(residualRate) + '、耐用年数 ' + years + '年)を定額法により減価償却する場合、当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。';

    const totalSteps = '<div class="step">' + totalLabel + ' = ' + (payByNote ? '手形1枚あたりの額面 × 枚数' : '1回あたりの支払額 × 支払回数') + '</div>' +
      '<div class="step">' + yen(installment) + ' × ' + count + (payByNote ? '枚' : '回') + ' = ' + yen(total) + '</div>';
    let costExplain;
    if (showCash) {
      costExplain = '<div class="step">割賦購入では、現金正価(現金で一括購入した場合の価額)を取得原価とする</div>' +
        '<div class="step">' + totalLabel + 'と現金正価の差額は利息相当額であり、取得原価に含めず、前払利息または支払利息として処理する</div>' +
        '<div class="step">利息相当額 = ' + totalLabel + ' − 現金正価</div>' +
        '<div class="step">' + yen(total) + ' − ' + yen(cost) + ' = ' + yen(interest) + '</div>' +
        '<div class="step formula">取得原価 = 現金正価 = ' + yen(cost) + '</div>';
    } else {
      costExplain = '<div class="step">割賦購入では、' + totalLabel + 'から利息相当額を除いた金額(現金正価)を取得原価とする</div>' +
        '<div class="step">利息相当額は取得原価に含めず、前払利息または支払利息として処理する</div>' +
        (showTotal ? '' : totalSteps) +
        '<div class="step">取得原価 = ' + totalLabel + ' − 利息相当額</div>' +
        '<div class="step formula">' + yen(total) + ' − ' + yen(interest) + ' = ' + yen(cost) + '</div>';
    }
    const depExplain = useFYStart
      ? '<div class="step" style="margin-top:16px;">当期首(' + acqDateStr + ')に取得しているため、当期は1年分の減価償却費を計上する</div>' +
        straightAnnualSteps(cost, residual, years, null, annual, true)
      : '<div class="step" style="margin-top:16px;">取得日から当期末までの使用月数は' + months + 'か月なので月割計算する</div>' +
        straightAnnualSteps(cost, residual, years, null, annual, false) +
        '<div class="step formula">当期分 = ' + yen(annual) + ' × ' + months + ' ÷ 12 = ' + yen(answer) + '</div>';

    return {
      level: '2', category: '割賦購入(' + (useFYStart ? '年間' : '月割') + ')',
      assetCost: cost,
      question: question,
      answer: answer,
      explain: costExplain + depExplain
    };
  }

  /* ---------- 2級: 資産の交換(同種・異種) ---------- */
  /* ---------- 1級: リース資産(現在価値基準) ---------- */
  const LEASE1_DECL_NUMER = { 4: 1, 5: 2, 8: 1, 10: 1 };
  const LEASE1_DECL_DENOM = { 4: 2, 5: 5, 8: 4, 10: 5 };
  function pvSum(payment, r, years, isPrepay) {
    let sum = 0;
    const startT = isPrepay ? 0 : 1;
    const endT = isPrepay ? years - 1 : years;
    for (let t = startT; t <= endT; t++) {
      sum += payment / Math.pow(1 + r, t);
    }
    return sum;
  }
  function genSaleAndLeaseback() {
    const item = pick(ITEMS_DECLINING_OK);

    const originalResidualRate = pickResidualRate();

    const ownershipTransfer = Math.random() < 0.5;
    const typeLabel = ownershipTransfer ? '所有権移転ファイナンス・リース' : '所有権移転外ファイナンス・リース';
    const lessorRatePct = pick([2, 3, 4, 5, 6, 8, 10]);
    const isPrepay = Math.random() < 0.2;

    const useDeclining = ownershipTransfer && Math.random() < 0.5;
    let leaseYears, newUsefulLife;
    if (useDeclining) {
      newUsefulLife = pick([4, 5, 8, 10]);
      leaseYears = Math.max(2, newUsefulLife - randInt(1, 2));
    } else {
      leaseYears = pick([3, 4, 5, 6, 7]);
      newUsefulLife = leaseYears + randInt(1, 2);
    }
    const depreciationYears = ownershipTransfer ? newUsefulLife : leaseYears;
    const needsResidual = ownershipTransfer && !useDeclining && originalResidualRate !== 0;
    const D = depreciationYears;

    let salePrice, bookValueAtSale, saleGainLoss, originalCost;
    let tries = 0;
    do {
      const bookValueBaseMin = Math.max(200, Math.ceil(1000 / D));
      const bookValueBase = randInt(bookValueBaseMin, Math.max(bookValueBaseMin + 500, 1500));
      bookValueAtSale = D * bookValueBase * 100;

      const isGainTarget = Math.random() < 0.85;
      const glMultiplier = isGainTarget ? randInt(50, 400) : -randInt(20, 250);
      saleGainLoss = D * glMultiplier * 100;
      salePrice = bookValueAtSale + saleGainLoss;

      if (needsResidual) {
        const req = lcm(D, 10);
        const mult = Math.max(1, Math.round(bookValueAtSale * 1.5 / req / 1000));
        originalCost = req * mult * 1000;
        if (originalCost <= bookValueAtSale) originalCost = bookValueAtSale + req * 1000;
      } else {
        originalCost = bookValueAtSale + Math.round(bookValueAtSale * (0.3 + Math.random() * 0.5) / 10000) * 10000;
      }
      tries++;
    } while (salePrice < 100000 && tries < 100);

    const leaseAssetCost = salePrice;
    const accumDep = originalCost - bookValueAtSale;

    const pvStartT = isPrepay ? 0 : 1;
    const pvEndT = isPrepay ? leaseYears - 1 : leaseYears;
    let pvFactor = 0;
    for (let t = pvStartT; t <= pvEndT; t++) pvFactor += 1 / Math.pow(1 + lessorRatePct / 100, t);
    const annualPayment = Math.max(10, Math.round(salePrice / pvFactor / 10) * 10);

    const showAccumDep = Math.random() < 0.5;
    const bvGivenClause = showAccumDep
      ? '減価償却累計額 ' + yen(accumDep) + ''
      : '帳簿価額 ' + yen(bookValueAtSale) + '';
    const bvSteps = showAccumDep
      ? '<div class="step">売却時点の帳簿価額 = 取得原価 − 減価償却累計額</div>' + '<div class="step">' + yen(originalCost) + ' − ' + yen(accumDep) + ' = ' + yen(bookValueAtSale) + '</div>'
      : '';

    const isGain = saleGainLoss >= 0;
    const deferredLabel = isGain ? '長期前受収益' : '長期前払費用';

    const residualAmt = needsResidual ? originalCost * 0.1 : 0;
    let annualDep, depStep;
    if (ownershipTransfer && useDeclining) {
      const numer = LEASE1_DECL_NUMER[depreciationYears], denom = LEASE1_DECL_DENOM[depreciationYears];
      annualDep = leaseAssetCost * numer / denom;
      depStep = '<div class="step" style="margin-top:16px;">所有権移転ファイナンス・リースのため、リースバック以後の耐用年数(' + depreciationYears + '年)で200%定率法により減価償却する</div>' +
        '<div class="step">当期の減価償却費(繰延損益調整前) = 計上額 × 償却率(1÷' + depreciationYears + '×200%)</div>' +
        '<div class="step">' + yen(leaseAssetCost) + ' × ' + (numer / denom) + ' = ' + yen(annualDep) + '</div>';
    } else if (ownershipTransfer) {
      annualDep = (leaseAssetCost - residualAmt) / depreciationYears;
      depStep = '<div class="step" style="margin-top:16px;">所有権移転ファイナンス・リースのため、リースバック以後の耐用年数(' + depreciationYears + '年)で減価償却する</div>' +
        (residualAmt === 0
          ? '<div class="step">当期の減価償却費(繰延損益調整前) = 計上額 ÷ 耐用年数</div>' +
            '<div class="step">' + yen(leaseAssetCost) + ' ÷ ' + depreciationYears + ' = ' + yen(annualDep) + '</div>'
          : '<div class="step">当期の減価償却費(繰延損益調整前) = (計上額 − 残存価額) ÷ 耐用年数</div>' +
            '<div class="step">(' + yen(leaseAssetCost) + ' − ' + yen(residualAmt) + ') ÷ ' + depreciationYears + ' = ' + yen(annualDep) + '</div>');
    } else {
      annualDep = (leaseAssetCost - residualAmt) / depreciationYears;
      depStep = '<div class="step" style="margin-top:16px;">所有権移転外ファイナンス・リースのため、リースバック以後の耐用年数ではなくリース期間(' + depreciationYears + '年)で減価償却し、従来の残存価額に関わらず残存価額はゼロとする</div>' +
        '<div class="step">当期の減価償却費(繰延損益調整前) = 計上額 ÷ リース期間</div>' +
        '<div class="step">' + yen(leaseAssetCost) + ' ÷ ' + depreciationYears + ' = ' + yen(annualDep) + '</div>';
    }

    let deferredAllocation, deferredAllocationStep;
    if (ownershipTransfer && useDeclining) {
      const numer = LEASE1_DECL_NUMER[depreciationYears], denom = LEASE1_DECL_DENOM[depreciationYears];
      deferredAllocation = saleGainLoss * numer / denom;
      deferredAllocationStep = '<div class="step">' + deferredLabel + 'の当期配分額 = 売却損益の未償却額 × 償却率</div>' +
        '<div class="step">' + (isGain ? '' : '−') + yen(Math.abs(saleGainLoss)) + ' × ' + (numer / denom) + ' = ' + (isGain ? '' : '−') + yen(Math.abs(deferredAllocation)) + '</div>';
    } else {
      deferredAllocation = saleGainLoss / depreciationYears;
      deferredAllocationStep = '<div class="step">' + deferredLabel + 'の当期配分額 = 売却損益 ÷ ' + (ownershipTransfer ? '耐用年数' : 'リース期間') + '</div>' +
        '<div class="step">' + (isGain ? '' : '−') + yen(Math.abs(saleGainLoss)) + ' ÷ ' + depreciationYears + ' = ' + (isGain ? '' : '−') + yen(Math.abs(deferredAllocation)) + '</div>';
    }
    const answer = annualDep - deferredAllocation;



    return {
      level: '1', category: 'リース資産(セール・アンド・リースバック)',
      question: '当社は当期首に保有する' + item + '(取得原価 ' + yen(originalCost) + '、' + bvGivenClause + '、' + residualText(originalResidualRate) + '、' + (useDeclining ? '200%定率法' : '定額法') + 'により償却)を' + yen(salePrice) + 'で売却するとともにセール・アンド・リースバック取引を行った。当取引は' + typeLabel + '取引に該当する。リース期間は' + leaseYears + '年、年間リース料は' + yen(annualPayment) + '(年1回' + (isPrepay ? '前払い' : '後払い') + ')、貸手の計算利子率は年' + lessorRatePct + '%である。リースバック以後の耐用年数は' + newUsefulLife + '年とし、残存価額・償却方法は従来と同様とする。当期の減価償却費を求めなさい。',
      answer: Math.round(answer),
      explain: bvSteps +
        '<div class="step">売却損益 = 売却価額 − 帳簿価額</div>' + '<div class="step">' + yen(salePrice) + ' − ' + yen(bookValueAtSale) + ' = ' + (isGain ? '' : '−') + yen(Math.abs(saleGainLoss)) + (isGain ? '(売却益)' : '(売却損)') + '</div>' +
        '<div class="step" style="margin-top:16px;">セール・アンド・リースバック取引では、売却損益をただちに損益計上せず、' + deferredLabel + 'として繰り延べ、リース資産の減価償却費の割合に応じて配分する</div>' +
        (ownershipTransfer
          ? '<div class="step">所有権移転ファイナンス・リースかつ貸手の購入価額が明らかなため、売却価額をそのままリース資産の計上額とする</div>'
          : '<div class="step">所有権移転外ファイナンス・リースであるが、貸手の購入価額(=見積現金購入価額)が実際売却価額として明らかなため、売却価額をそのままリース資産の計上額とする</div>') +
        '<div class="step formula">リース資産の計上額 = 売却価額 = ' + yen(leaseAssetCost) + '</div>' +
        depStep +
        deferredAllocationStep +
        '<div class="step">損益計算書上の減価償却費 = 減価償却費(調整前) ' + (isGain ? '−' : '+') + ' ' + deferredLabel + 'の当期配分額</div>' +
        '<div class="step formula">' + yen(annualDep) + (isGain ? ' − ' : ' + ') + yen(Math.abs(deferredAllocation)) + ' = ' + yen(Math.round(answer)) + '</div>'
    };
  }

  function genLeaseAssetLevel1() {
    const isPrepay = Math.random() < 0.2;
    const item = pick(ITEMS_DECLINING_OK);
    const ownershipTransfer = Math.random() < 0.5;
    const lessorCostKnown = Math.random() < 0.3;

    const acqPeriod1 = determineAcqPeriod(0.5, 0);
    const useFYStart = acqPeriod1.useFYStart;
    let monthFactor = acqPeriod1.multipleNeeded, months = acqPeriod1.useFYStart ? null : acqPeriod1.months;

    let useDeclining = false, leaseYears, similarYears, depreciationYears, residualRate, decoyMethodLabel;
    if (ownershipTransfer) {
      useDeclining = Math.random() < 0.5;
      if (useDeclining) {
        similarYears = pick([4, 5, 8, 10]);
        leaseYears = similarYears - randInt(1, 2);
        if (leaseYears < 2) leaseYears = 2;
      } else {
        leaseYears = pick([3, 4, 5, 6, 7]);
        similarYears = leaseYears + randInt(1, 2);
      }
      depreciationYears = similarYears;
      residualRate = pickResidualRate();
    } else {
      leaseYears = pick([3, 4, 5, 6, 7]);
      depreciationYears = leaseYears;
      residualRate = 0;
      similarYears = leaseYears + randInt(1, 2);
      decoyMethodLabel = Math.random() < 0.5 ? '定額法' : '200%定率法';
    }

    const ratePct = pick([2, 3, 4, 5, 6, 8, 10]);
    const rate = ratePct / 100;

    let mode;
    if (ownershipTransfer && lessorCostKnown) mode = 'direct_lessor';
    else if (!ownershipTransfer && lessorCostKnown) mode = 'min_lessor';
    else mode = 'min_estimated';

    let cost, comparatorValue, annualPayment, presentValue;

    if (mode === 'direct_lessor') {
      let D;
      if (useDeclining) {
        const denom = LEASE1_DECL_DENOM[depreciationYears];
        D = lcm(denom, monthFactor);
      } else {
        const combinedTarget = 10 * depreciationYears * monthFactor;
        D = combinedTarget / gcd(9, combinedTarget);
      }
      const costMultiplier = Math.max(1, Math.round(randInt(50, 500) * 10000 / D / 10000));
      cost = D * costMultiplier * 10000;
      comparatorValue = cost;

      const pvFactor = pvSum(1, rate, leaseYears, isPrepay);
      const targetAnnualPayment = cost / pvFactor * (0.85 + Math.random() * 0.3);
      const annualPaymentBase = Math.max(1, Math.round(targetAnnualPayment / 1000));
      annualPayment = annualPaymentBase * 1000;
      presentValue = Math.round(pvSum(annualPayment, rate, leaseYears, isPrepay));
    } else {
      const annualPaymentBase = randInt(200, 2000);
      annualPayment = annualPaymentBase * 1000;
      presentValue = Math.round(pvSum(annualPayment, rate, leaseYears, isPrepay));

      const rateDirection = Math.random() < 0.5 ? 1 : -1;
      const comparatorRatePct = Math.max(1, ratePct + rateDirection * randInt(1, 5));
      const comparatorRate = comparatorRatePct / 100;
      comparatorValue = Math.round(pvSum(annualPayment, comparatorRate, leaseYears, isPrepay));

      const pvWins = presentValue <= comparatorValue;
      cost = pvWins ? presentValue : comparatorValue;
    }

    const residual = residualRate === 0 ? 0 : cost * 0.1;
    let annualFull, methodLabel;
    if (useDeclining) {
      const numer = LEASE1_DECL_NUMER[depreciationYears], denom = LEASE1_DECL_DENOM[depreciationYears];
      annualFull = cost * numer / denom;
      methodLabel = '200%定率法';
    } else {
      annualFull = (cost - residual) / depreciationYears;
      methodLabel = '定額法';
    }

    let acqDateStr;
    if (useFYStart) {
      const d = fyMonthToDate(CURRENT_FY, 1);
      acqDateStr = dateStr(d.year, d.month);
    } else {
      const fyMonth = 13 - months;
      const d = fyMonthToDate(CURRENT_FY, fyMonth);
      acqDateStr = dateStr(d.year, d.month);
    }

    const periodWord = ownershipTransfer ? '耐用年数' : 'リース期間';
    const depLabel = useDeclining
      ? '計上額 × 償却率(1÷' + depreciationYears + '×200%)'
      : (residual === 0 ? '計上額 ÷ ' + periodWord : '(計上額 − 残存価額) ÷ ' + periodWord);
    const depCalc = useDeclining
      ? yen(cost) + ' × ' + (LEASE1_DECL_NUMER[depreciationYears] / LEASE1_DECL_DENOM[depreciationYears])
      : (residual === 0 ? yen(cost) + ' ÷ ' + depreciationYears : '(' + yen(cost) + ' − ' + yen(residual) + ') ÷ ' + depreciationYears);
    const annualCalcStepFull = '<div class="step">当期の減価償却費 = ' + depLabel + '</div>' +
      '<div class="step formula">' + depCalc + ' = ' + yen(annualFull) + '</div>';
    const annualCalcStep = '<div class="step">年間の減価償却費(1年分) = ' + depLabel + '</div>' +
      '<div class="step">' + depCalc + ' = ' + yen(annualFull) + '</div>';

    let answer, proRateSteps;
    if (useFYStart) {
      answer = Math.round(annualFull);
      proRateSteps = annualCalcStepFull;
    } else {
      answer = Math.round(annualFull * months / 12);
      proRateSteps = '<div class="step">取得日から当期末までの使用月数は' + months + 'か月なので月割計算する</div>' +
        annualCalcStep +
        '<div class="step formula">当期の減価償却費 = ' + yen(annualFull) + ' × ' + months + ' ÷ 12 = ' + yen(answer) + '</div>';
    }

    const typeLabel = ownershipTransfer ? '所有権移転ファイナンス・リース' : '所有権移転外ファイナンス・リース';
    const extraInfoClause = lessorCostKnown
      ? 'であり、貸手の購入価額は' + yen(comparatorValue) + 'である。'
      : 'であり、見積現金購入価額は' + yen(comparatorValue) + 'である。';
    const similarAssetClause = ownershipTransfer
      ? '当社が保有する同種資産の耐用年数は' + similarYears + '年、償却方法は' + methodLabel + '、' + residualText(residualRate) + 'である。'
      : '当社が保有する同種資産の耐用年数は' + similarYears + '年、償却方法は' + decoyMethodLabel + '、残存価額は取得原価の10%である。';

    let pvTerms = '';
    const pvStartT = isPrepay ? 0 : 1;
    const pvEndT = isPrepay ? leaseYears - 1 : leaseYears;
    for (let t = pvStartT; t <= pvEndT; t++) {
      const term = t === 0 ? yen(annualPayment) : yen(annualPayment) + '÷(1+' + rate + ')<sup>' + t + '</sup>';
      pvTerms += (t === pvStartT ? '' : ' + ') + term;
    }

    const costBasisExplain = (function () {
      if (mode === 'direct_lessor') {
        return '<div class="step">所有権移転ファイナンス・リースで貸手の購入価額が明らかな場合、貸手の購入価額をそのままリース資産の計上額とする</div>' +
          '<div class="step formula">リース資産の計上額 = 貸手の購入価額 = ' + yen(cost) + '</div>';
      }
      const compareLabel = mode === 'min_lessor' ? '貸手の購入価額' : '見積現金購入価額';
      const explainIntro = mode === 'min_lessor'
        ? '<div class="step">所有権移転外ファイナンス・リースで貸手の購入価額が明らかな場合、リース料総額の割引現在価値と貸手の購入価額のいずれか低い額をリース資産の計上額とする</div>'
        : '<div class="step">貸手の購入価額が明らかでない場合、リース料総額の割引現在価値と見積現金購入価額のいずれか低い額をリース資産の計上額とする</div>';
      return explainIntro +
        (isPrepay
          ? '<div class="step">リース料総額の割引現在価値 = 各年のリース料を割引率で現在価値に割り引いた金額の合計(前払いのため、第1回目の支払いは取得日と同時であり割引計算は不要)</div>'
          : '<div class="step">リース料総額の割引現在価値 = 各年のリース料を割引率で現在価値に割り引いた金額の合計</div>') +
        '<div class="step">' + pvTerms + ' ≒ ' + yen(presentValue) + '</div>' +
        '<div class="step" style="margin-top:16px;">割引現在価値(' + yen(presentValue) + ')と' + compareLabel + '(' + yen(comparatorValue) + ')を比較すると、' + (presentValue <= comparatorValue ? '割引現在価値' : compareLabel) + 'のほうが低いため、これをリース資産の計上額とする</div>' +
        '<div class="step formula">リース資産の計上額 = ' + yen(cost) + '</div>';
    })();

    const depreciationExplain = ownershipTransfer
      ? '<div class="step" style="margin-top:16px;">所有権移転ファイナンス・リースは、自己所有の固定資産と同様に、同種資産の耐用年数・償却方法・残存価額によって減価償却する</div>'
      : '<div class="step" style="margin-top:16px;">所有権移転外ファイナンス・リースは、同種資産の情報は用いず、リース期間を耐用年数、残存価額ゼロ・定額法として減価償却する</div>';

    return {
      level: '1', category: 'リース資産(現在価値基準・' + typeLabel + ')',
      question: '当社は' + acqDateStr + 'に、' + typeLabel + '取引により' + item + 'をリースにより取得した。リース期間は' + leaseYears + '年、年間リース料は' + yen(annualPayment) + '(年1回' + (isPrepay ? '前払い' : '後払い') + ')、当社の追加借入利子率は年' + ratePct + '%' + extraInfoClause + similarAssetClause + '当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい(リース資産の計上額を求めた後、計算の最終段階でのみ円未満を四捨五入すること)。',
      answer,
      explain: costBasisExplain + depreciationExplain + proRateSteps
    };
  }

  function genAssetExchange() {
    const sameKind = Math.random() < 0.5;
    const useDeclining = Math.random() < 0.4;
    const itemPool = useDeclining ? ITEMS_DECLINING_OK : ITEMS_TANGIBLE;
    const oldItem = pick(itemPool);
    let newItem = oldItem;
    if (!sameKind) newItem = pick(itemPool.filter(function (x) { return x !== oldItem; }));

    let years, residualRate, annual, newCost, residual, rate;
    if (useDeclining) {
      const DECL = { 4: 0.5, 5: 0.4, 8: 0.25, 10: 0.2 };
      const rateFrac = { 0.5: [1, 2], 0.4: [2, 5], 0.25: [1, 4], 0.2: [1, 5] };
      years = pick(Object.keys(DECL).map(Number));
      rate = DECL[years];
      const [rNumer, rDenom] = rateFrac[rate];
      residualRate = pickResidualRate();
      // 取得原価は80万円以上(交換差金・時価との差を考慮しても帳簿価額・時価が50万円以上になるように)
      const costBase = rDenom * randInt(4000, 30000);
      newCost = costBase * 100;
      annual = newCost * rNumer / rDenom;
      residual = 0;
    } else {
      years = yearsForItem(newItem, YEARS);
      residualRate = pickResidualRate();
      // 取得原価は80万円以上(交換差金・時価との差を考慮しても帳簿価額・時価が50万円以上になるように)
      const minZero = Math.ceil(8000 / years), minTen = Math.ceil(800 / years);
      const annualBase = residualRate === 0 ? randInt(minZero, Math.max(minZero + 5400, 6000)) : 9 * randInt(minTen, Math.max(minTen + 500, 600));
      annual = annualBase * 100;
      const dep = annual * years;
      const built = buildCostFromDep(dep, residualRate);
      newCost = built.cost;
      residual = built.residual;
    }

    // 交換差金(約25%):当社が現金を支払うケースのみ。取得原価(newCost)から逆算する
    const useCash = Math.random() < 0.25;
    let bookValue, fairValue, newFairValue, cashPaid = 0;
    const bvLessThanFv = Math.random() < 0.7;
    const pctDiff = randInt(2, 10);
    if (useCash) cashPaid = Math.max(1000, Math.round(newCost * randInt(10, 30) / 100 / 1000) * 1000);
    if (sameKind) {
      bookValue = newCost - cashPaid;
      const rawFair = bvLessThanFv ? bookValue * (100 + pctDiff) / 100 : bookValue * (100 - pctDiff) / 100;
      fairValue = Math.max(10000, Math.round(rawFair / 1000) * 1000);
      newFairValue = fairValue + cashPaid;
    } else {
      fairValue = newCost - cashPaid;
      const rawBook = bvLessThanFv ? fairValue * (100 - pctDiff) / 100 : fairValue * (100 + pctDiff) / 100;
      bookValue = Math.max(10000, Math.round(rawBook / 1000) * 1000);
      newFairValue = newCost;
    }
    const typeLabel = sameKind ? '同種資産の交換' : '異種資産の交換';
    const exchangeDate = fyStartDateStr(CURRENT_FY);
    const methodClause = useDeclining ? residualText(residualRate) + '、200%定率法により' : residualText(residualRate) + '、定額法により';
    const baseLabel = sameKind ? '譲渡資産の帳簿価額' : '譲渡資産の時価';
    const baseValue = sameKind ? bookValue : fairValue;
    const costSteps = '<div class="step">' + (sameKind ? '同種資産の交換では、譲渡資産の帳簿価額を新資産の取得原価とする' : '異種資産の交換では、譲渡資産の時価を新資産の取得原価とする') + (useCash ? '(交換差金を支払った場合は、その額を加える)' : '') + '</div>' +
      (useCash
        ? '<div class="step">新資産の取得原価 = ' + baseLabel + ' + 支払った交換差金</div>' +
          '<div class="step formula">' + yen(baseValue) + ' + ' + yen(cashPaid) + ' = ' + yen(newCost) + '</div>'
        : '<div class="step formula">新資産の取得原価 = ' + baseLabel + ' = ' + yen(newCost) + '</div>');
    const depLabel = useDeclining ? '取得原価 × 償却率' : (residual === 0 ? '取得原価 ÷ 耐用年数' : '(取得原価 − 残存価額) ÷ 耐用年数');
    const depCalc = useDeclining ? yen(newCost) + ' × ' + rate : (residual === 0 ? yen(newCost) + ' ÷ ' + years : '(' + yen(newCost) + ' − ' + yen(residual) + ') ÷ ' + years);
    const depSteps = '<div class="step" style="margin-top:16px;">当期首(' + exchangeDate + ')に取得しているため、当期は1年分の減価償却費を計上する</div>' +
      (useDeclining
        ? '<div class="step">定率法では残存価額は計算に使用しない</div>' +
          '<div class="step">200%定率法の償却率 = 1 ÷ 耐用年数' + years + '年 × 200% = ' + rate + '</div>'
        : '') +
      '<div class="step">当期の減価償却費 = ' + depLabel + '</div>' +
      '<div class="step formula">' + depCalc + ' = ' + yen(annual) + '</div>';
    return {
      level: '1', category: '資産の交換(' + typeLabel + '・' + (useDeclining ? '定率法' : '定額法') + ')',
      question: '当社は、' + exchangeDate + 'に、保有する' + oldItem + '(帳簿価額 ' + yen(bookValue) + '、時価 ' + yen(fairValue) + ')を提供し、' + (useCash ? '交換差金として現金 ' + yen(cashPaid) + 'を支払って、' : '') + typeLabel + 'により新たに' + newItem + '(時価 ' + yen(newFairValue) + '、耐用年数 ' + years + '年、' + methodClause + '減価償却)を取得した。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。',
      answer: annual,
      explain: costSteps + depSteps
    };
  }

  // 級数法の要償却額の行(残存価額ゼロのときは「− ¥0」を表示しない)
  function soydDepreciableStep(cost, residual) {
    return residual === 0
      ? '<div class="step">残存価額がゼロのため、要償却額 = 取得原価 = ' + yen(cost) + '</div>'
      : '<div class="step">要償却額 = ' + yen(cost) + ' − ' + yen(residual) + ' = ' + yen(cost - residual) + '</div>';
  }

  /* ---------- 1級: 級数法 ---------- */
  function genSumOfYearsDigits() {
    if (Math.random() < 0.25) return genSumOfYearsFinalYear();
    const item = pick(ITEMS_TANGIBLE);
    const years = item === '建物' ? pick([20, 22, 24]) : (item === '建物附属設備' || item === '構築物') ? pick([10, 12, 15]) : pick([4, 5, 6]);
    const T = years * (years + 1) / 2;
    const elapsed = Math.random() < 0.4 ? 0 : randInt(1, Math.min(8, years - 1));
    const residualRate = pickResidualRate();
    const factor = residualRate === 0 ? 1 : 9;

    if (elapsed === 0) {
      const useFYStart = Math.random() < 21 / 40;
      let acqYear, acqMonth, currentPeriodMonths, useFixedMidYearDate = false;
      if (useFYStart) {
        const acq = pastFYStart(0);
        acqYear = acq.year; acqMonth = acq.month; currentPeriodMonths = 12;
      } else {
        useFixedMidYearDate = Math.random() < 0.5;
        const midYearMonth = fixedTrapCalendarMonth();
        if (useFixedMidYearDate) {
          const d = fyMonthToDate(CURRENT_FY, ((midYearMonth - FY_START_MONTH + 12) % 12) + 1);
          acqYear = d.year; acqMonth = d.month;
        } else {
          const gap = randInt(1, 11);
          const d = fyMonthToDate(CURRENT_FY, (gap % 12) + 1);
          acqYear = d.year; acqMonth = d.month;
        }
        currentPeriodMonths = 13 - ((((acqMonth - FY_START_MONTH + 12) % 12)) + 1);
      }
      const acqDateStr = (useFYStart || useFixedMidYearDate) ? dateStr(acqYear, acqMonth) : dateStrAnyDay(acqYear, acqMonth);
      const monthMult = useFYStart ? 1 : (12 / gcd(12, currentPeriodMonths));
      const k = randInt(100, 400) * monthMult;
      const dep = 100 * T * k * factor;
      const perYearFactor = dep / T;
      const annual = perYearFactor * years;
      const answer = useFYStart ? annual : Math.round(annual * currentPeriodMonths / 12);
      const { cost, residual } = buildCostFromDep(dep, residualRate);

      const monthStep = useFYStart
        ? '<div class="step" style="margin-top:16px;">1年目の減価償却費 = 要償却額 × 耐用年数 ÷ 総項数</div>' +
          '<div class="step formula">' + yen(cost - residual) + ' × ' + years + ' ÷ ' + T + ' = ' + yen(annual) + '</div>'
        : '<div class="step">取得日から当期末までの使用月数は' + currentPeriodMonths + 'か月なので月割計算する</div>' +
          '<div class="step" style="margin-top:16px;">1年目の年間減価償却費 = 要償却額 × 耐用年数 ÷ 総項数</div>' +
          '<div class="step">' + yen(cost - residual) + ' × ' + years + ' ÷ ' + T + ' = ' + yen(annual) + '</div>' +
          '<div class="step formula">当期分 = ' + yen(annual) + ' × ' + currentPeriodMonths + ' ÷ 12 = ' + yen(answer) + '</div>';

      return {
        level: '1', category: '級数法',
        question: acqDateStr + 'に取得した' + item + '(取得原価 ' + yen(cost) + '、' + residualText(residualRate) + '、耐用年数 ' + years + '年)を級数法により減価償却する。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費はいくらか。',
        answer,
        explain: soydDepreciableStep(cost, residual) +
          '<div class="step formula">総項数 = n(n+1)÷2 = ' + years + '×(' + years + '+1)÷2 = ' + T + '</div>' +
          monthStep
      };
    }

    const t = elapsed + 1;
    const remaining = years - t + 1;
    const useFYStart = Math.random() < 39 / 60;
    let acq, useFixedMidYearDatePast = false;
    if (useFYStart) {
      acq = pastFYStart(elapsed);
    } else {
      useFixedMidYearDatePast = Math.random() < 0.5;
      if (useFixedMidYearDatePast) {
        const midYearMonth = fixedTrapCalendarMonth();
        const fy = CURRENT_FY - elapsed;
        const d = fyMonthToDate(fy, ((midYearMonth - FY_START_MONTH + 12) % 12) + 1);
        acq = { year: d.year, month: d.month, fy };
      } else {
        acq = pastDate(elapsed);
      }
    }
    const effectiveFYStart = useFYStart || acq.month === FY_START_MONTH;

    let dep, cost, residual, answer, soydRows;
    if (effectiveFYStart) {
      const kMax = item === '建物' ? Math.max(400, Math.floor(2000000000 / (100 * T * factor))) : 400;
      const k = randInt(100, kMax);
      dep = 100 * T * k * factor;
      const perYearFactor = dep / T;
      answer = perYearFactor * remaining;
      const c = buildCostFromDep(dep, residualRate);
      cost = c.cost; residual = c.residual;

      soydRows = [];
      let bv = cost;
      for (let yr = 1; yr <= t; yr++) {
        const numerator = years - yr + 1;
        const depYr = perYearFactor * numerator;
        const newBv = bv - depYr;
        soydRows.push({ year: yr, isCurrent: yr === t, beginningBV: bv, endingBV: newBv, depreciation: depYr, parts: [{ numerator: numerator, months: 12, dep: depYr }] });
        bv = newBv;
      }
    } else {
      const m1 = 13 - ((((acq.month - FY_START_MONTH + 12) % 12)) + 1);
      const monthMult = 12 / gcd(12, m1);
      const kMaxBase = item === '建物' ? Math.max(400, Math.floor(2000000000 / (100 * T * factor * monthMult))) : 400;
      const kMult = monthMult * randInt(20, Math.max(21, Math.floor(kMaxBase / monthMult)));
      dep = 100 * T * kMult * factor;
      const U = dep / T;
      const D = U * m1 / 12;
      const c = buildCostFromDep(dep, residualRate);
      cost = c.cost; residual = c.residual;

      soydRows = [];
      let bv = cost;
      for (let s = 1; s <= t; s++) {
        let depS, parts;
        if (s === 1) {
          depS = years * D;
          parts = [{ numerator: years, months: m1, dep: depS }];
        } else {
          const numer1 = years - s + 2, numer2 = years - s + 1;
          const dep1 = numer1 * (U - D);
          const dep2 = numer2 * D;
          depS = dep1 + dep2;
          parts = [
            { numerator: numer1, months: 12 - m1, dep: dep1 },
            { numerator: numer2, months: m1, dep: dep2 }
          ];
        }
        const newBv = bv - depS;
        soydRows.push({ year: s, isCurrent: s === t, beginningBV: bv, endingBV: newBv, depreciation: depS, parts: parts });
        bv = newBv;
      }
      answer = soydRows[soydRows.length - 1].depreciation;
    }

    return {
      level: '1', category: '級数法',
      question: (useFYStart || useFixedMidYearDatePast ? dateStr(acq.year, acq.month) : dateStrAnyDay(acq.year, acq.month)) + 'に取得した' + item + '(取得原価 ' + yen(cost) + '、' + residualText(residualRate) + '、耐用年数 ' + years + '年)を級数法により減価償却している。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費はいくらか。',
      answer,
      explain: soydDepreciableStep(cost, residual) +
        '<div class="step formula">総項数 = n(n+1)÷2 = ' + years + '×(' + years + '+1)÷2 = ' + T + '</div>' +
        (effectiveFYStart
          ? '<div class="step" style="margin-top:16px;">各年度の減価償却費 = 要償却額 × 当期項数(残存耐用年数)÷総項数</div>' + '<div class="step formula">' + yen(cost - residual) + ' × ' + (years - t + 1) + ' ÷ ' + T + ' = ' + yen(answer) + '</div>'
          : (function () {
              const depreciableAmount = cost - residual;
              const parts = soydRows[soydRows.length - 1].parts;
              return '<div class="step" style="margin-top:16px;">取得日が期首と一致しないため、取得日を起点とした「所有年度」ごとの項数が会計年度をまたぐ。2年目以降の各会計年度は、2つの所有年度の項数を月数按分して合計する</div>' +
                '<div class="step">当期の減価償却費 = (要償却額 × 項数(' + parts[0].numerator + '/' + T + ') × ' + parts[0].months + 'か月÷12か月) + (要償却額 × 項数(' + parts[1].numerator + '/' + T + ') × ' + parts[1].months + 'か月÷12か月)</div>' +
                '<div class="step formula">(' + yen(depreciableAmount) + ' × ' + parts[0].numerator + '/' + T + ' × ' + parts[0].months + ' ÷ 12) + (' + yen(depreciableAmount) + ' × ' + parts[1].numerator + '/' + T + ' × ' + parts[1].months + ' ÷ 12) = ' + yen(parts[0].dep) + ' + ' + yen(parts[1].dep) + ' = ' + yen(answer) + '</div>';
            })()) +
        buildSumOfYearsTable(soydRows, T)
    };
  }

  /* ---------- 1級: 級数法(償却最終年度) ---------- */
  function genSumOfYearsFinalYear() {
    const item = pick(['備品', '車両運搬具', '機械装置']);
    const years = pick([4, 5, 6]);
    const T = years * (years + 1) / 2;
    const useTenPercent = Math.random() < 0.4;
    const residualRate = useTenPercent ? 0.1 : 0;
    const factor = useTenPercent ? 9 : 1;
    const isFinal = useTenPercent ? true : Math.random() < 0.6;
    const useMid = Math.random() < 0.5;
    const m1 = useMid ? randInt(1, 11) : 12;
    const monthMult = 12 / gcd(12, m1);
    const k = monthMult * randInt(Math.ceil(40 / monthMult), Math.floor(400 / monthMult));
    const dep = 100 * T * k * factor;
    const U = dep / T;
    const D = U * m1 / 12;
    const c = buildCostFromDep(dep, residualRate);
    const cost = c.cost, residual = c.residual;
    const lastYear = useMid ? years + 1 : years;
    const t = isFinal ? lastYear : lastYear - 1;

    const rows = [];
    let bv = cost;
    for (let s = 1; s <= t; s++) {
      let depS, parts;
      if (!useMid) {
        const numerator = years - s + 1;
        depS = U * numerator;
        parts = [{ numerator: numerator, months: 12, dep: depS }];
      } else if (s === 1) {
        depS = years * D;
        parts = [{ numerator: years, months: m1, dep: depS }];
      } else if (s === years + 1) {
        depS = U - D;
        parts = [{ numerator: 1, months: 12 - m1, dep: depS }];
      } else {
        const numer1 = years - s + 2, numer2 = years - s + 1;
        depS = numer1 * (U - D) + numer2 * D;
        parts = [{ numerator: numer1, months: 12 - m1, dep: numer1 * (U - D) }, { numerator: numer2, months: m1, dep: numer2 * D }];
      }
      const isCur = s === t;
      if (isCur && isFinal && !useTenPercent) {
        depS = bv - 1;
        parts = parts.map(function (p) { return { numerator: p.numerator, months: p.months, dep: depS }; });
      }
      rows.push({ year: s, isCurrent: isCur, beginningBV: bv, endingBV: bv - depS, depreciation: depS, parts: parts });
      bv -= depS;
    }
    const cur = rows[rows.length - 1];
    const answer = cur.depreciation;
    const bookValueStart = cur.beginningBV;

    const e = t - 1;
    let acqDateStr;
    if (useMid) {
      const d = fyMonthToDate(CURRENT_FY - e, 13 - m1);
      acqDateStr = Math.random() < 0.5 ? dateStrAnyDay(d.year, d.month) : dateStr(d.year, d.month);
    } else {
      const a = pastFYStart(e);
      acqDateStr = dateStr(a.year, a.month);
    }

    const D0 = cost - residual;
    const endCheck = '<div class="step">当期末の帳簿価額は、当期首の帳簿価額' + yen(bookValueStart) + ' − 当期の減価償却費' + yen(answer) + ' = ' + yen(bookValueStart - answer) + 'となり、残存価額(' + yen(residual) + ')と一致する</div>';
    const memoSteps = '<div class="step">償却最終年度は、備忘価額1円を残して帳簿価額の全額を償却する</div>' +
      '<div class="step">当期の減価償却費 = 当期首の帳簿価額 − 備忘価額</div>' +
      '<div class="step formula">' + yen(bookValueStart) + ' − ¥1 = ' + yen(answer) + '</div>';
    let resultSteps;
    if (!useMid) {
      if (isFinal) {
        resultSteps = '<div class="step" style="margin-top:16px;">当期は耐用年数' + years + '年の最終年度(' + years + '年目)であり、当期項数は1である</div>' +
          (useTenPercent
            ? '<div class="step">各年度の減価償却費 = 要償却額 × 当期項数(残存耐用年数)÷総項数</div>' +
              '<div class="step formula">' + yen(D0) + ' × 1 ÷ ' + T + ' = ' + yen(answer) + '</div>' + endCheck
            : memoSteps);
      } else {
        resultSteps = '<div class="step" style="margin-top:16px;">当期は耐用年数' + years + '年のうち' + t + '年目であり、償却最終年度ではないため、備忘価額1円を残す処理は行わない</div>' +
          '<div class="step">各年度の減価償却費 = 要償却額 × 当期項数(残存耐用年数)÷総項数</div>' +
          '<div class="step formula">' + yen(D0) + ' × ' + (years - t + 1) + ' ÷ ' + T + ' = ' + yen(answer) + '</div>';
      }
    } else {
      const intro = '<div class="step" style="margin-top:16px;">取得日が期首と一致しないため、取得日を起点とした「所有年度」ごとの項数が会計年度をまたぐ</div>';
      if (isFinal) {
        resultSteps = intro +
          '<div class="step">初年度が' + m1 + 'か月分だったため、最後の所有年度(項数1)の残り' + (12 - m1) + 'か月分を償却する' + t + '年目(当期)が償却最終年度になる</div>' +
          (useTenPercent
            ? '<div class="step">当期の減価償却費 = 要償却額 × 項数(1/' + T + ') × ' + (12 - m1) + 'か月÷12か月</div>' +
              '<div class="step formula">' + yen(D0) + ' × 1/' + T + ' × ' + (12 - m1) + ' ÷ 12 = ' + yen(answer) + '</div>' + endCheck
            : memoSteps);
      } else {
        const ps = cur.parts;
        resultSteps = intro +
          '<div class="step">初年度が' + m1 + 'か月分だったため、償却最終年度は' + lastYear + '年目になる。当期(' + t + '年目)は償却最終年度ではないため、備忘価額1円を残す処理は行わない</div>' +
          '<div class="step">当期の減価償却費 = (要償却額 × 項数(' + ps[0].numerator + '/' + T + ') × ' + ps[0].months + 'か月÷12か月) + (要償却額 × 項数(' + ps[1].numerator + '/' + T + ') × ' + ps[1].months + 'か月÷12か月)</div>' +
          '<div class="step formula">(' + yen(D0) + ' × ' + ps[0].numerator + '/' + T + ' × ' + ps[0].months + ' ÷ 12) + (' + yen(D0) + ' × ' + ps[1].numerator + '/' + T + ' × ' + ps[1].months + ' ÷ 12) = ' + yen(ps[0].dep) + ' + ' + yen(ps[1].dep) + ' = ' + yen(answer) + '</div>';
      }
    }

    return {
      level: '1', category: useTenPercent ? '級数法(償却最終年度・残存価額10%)' : '級数法(償却最終年度・備忘価額)',
      question: acqDateStr + 'に取得した' + item + '(取得原価 ' + yen(cost) + '、' + residualText(residualRate) + '、耐用年数 ' + years + '年)を級数法により減価償却している。' + (useTenPercent ? '' : 'なお、耐用年数の経過時には備忘価額1円を残して償却するものとする。') + '当期(' + fyLabel(CURRENT_FY) + ')の減価償却費はいくらか。',
      answer,
      explain: soydDepreciableStep(cost, residual) +
        '<div class="step formula">総項数 = n(n+1)÷2 = ' + years + '×(' + years + '+1)÷2 = ' + T + '</div>' +
        resultSteps +
        buildSumOfYearsTable(rows, T)
    };
  }

  // 総合償却:耐用年数に見合った資産の種類を選ぶ
  const GROUP_ITEM_RANGES = [['備品', 3, 15], ['車両運搬具', 3, 10], ['機械装置', 5, 22], ['建物附属設備', 8, 18], ['構築物', 10, 99]];
  function groupItemForYears(y) {
    const candidates = GROUP_ITEM_RANGES.filter(function (r) { return y >= r[1] && y <= r[2]; }).map(function (r) { return r[0]; });
    return candidates.length ? pick(candidates) : '構築物';
  }
  // 同じ種類の資産だけでグループを作る場合:すべての耐用年数をカバーできる資産の種類(なければ null)
  function groupSingleItemForYears(yearsList) {
    const lo = Math.min.apply(null, yearsList), hi = Math.max.apply(null, yearsList);
    const candidates = GROUP_ITEM_RANGES.filter(function (r) { return lo >= r[1] && hi <= r[2]; }).map(function (r) { return r[0]; });
    return candidates.length ? pick(candidates) : null;
  }

  /* ---------- 1級: 総合償却 ---------- */
  function genGroupDepreciation() {
    const averageLife = randInt(4, 15);
    const N = pick([3, 4, 5]);

    const uniformResidual = true;
    const residualRates = [];
    if (uniformResidual) {
      const r = pickResidualRate();
      for (let i = 0; i < N; i++) residualRates.push(r);
    } else {
      for (let i = 0; i < N; i++) residualRates.push(pickResidualRate());
    }
    const anyResidual = residualRates.some(function (r) { return r === 0.1; });
    const resMult = anyResidual ? 9 : 1;

    const minOffset = Math.max(-6, 3 - averageLife);
    const useSingleItem = Math.random() < 0.4;
    let singleItem = null;
    let offsets, years, zeroIdx, derivedIdx, useFYStart, pf, monthFactor;
    let answer, sumAnnual, decrement, annuals = [], costsCheck;
    let outerTries = 0;
    let success = false;
    do {
      offsets = [0, 1];
      while (offsets.length < N) { offsets.push(randInt(minOffset, 8)); }
      for (let i = offsets.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = offsets[i]; offsets[i] = offsets[j]; offsets[j] = tmp;
      }
      years = offsets.map(function (o) { return averageLife + o; });
      singleItem = useSingleItem ? groupSingleItemForYears(years) : null;
      if (useSingleItem && !singleItem) { outerTries++; continue; }
      zeroIdx = offsets.indexOf(0);
      derivedIdx = offsets.indexOf(1);

      useFYStart = Math.random() < 0.5;
      pf = useFYStart ? null : periodFactor();
      monthFactor = useFYStart ? 1 : pf.multipleNeeded;

      let tries = 0;
      let lifeOk = false;
      do {
        const ansBaseUnit = monthFactor * resMult;
        const ansBase = ansBaseUnit * randInt(Math.ceil(1500 / monthFactor), Math.max(Math.ceil(1500 / monthFactor) + 1, Math.floor(4500 / monthFactor)));
        answer = ansBase * 100;
        const decrementK = randInt(200, 400) * resMult;
        decrement = decrementK * 100;
        sumAnnual = answer - decrement;
        lifeOk = Math.floor(averageLife * answer / sumAnnual) === averageLife;

        if (lifeOk) {
          annuals = new Array(N).fill(0);
          let freeSum = 0;
          for (let i = 0; i < N; i++) {
            if (i === zeroIdx || i === derivedIdx) continue;
            const base = randInt(150, 350) * resMult;
            annuals[i] = base * 100;
            freeSum += annuals[i] * offsets[i];
          }
          annuals[derivedIdx] = averageLife * decrement - freeSum;
          const usedSum = annuals.reduce(function (s, v, i) { return i === zeroIdx ? s : s + v; }, 0);
          annuals[zeroIdx] = sumAnnual - usedSum;
        }
        tries++;
      } while ((!lifeOk || annuals.some(function (a) { return a <= 0; })) && tries < 2000);

      if (lifeOk && annuals && annuals.every(function (a) { return a > 0; })) {
        costsCheck = annuals.map(function (a, i) { return buildCostFromDep(a * years[i], residualRates[i]); });
        success = costsCheck.every(function (c) { return c.cost >= 100000; });
      } else {
        success = false;
      }
      outerTries++;
    } while (!success && outerTries < 600);

    const deps = annuals.map(function (a, i) { return a * years[i]; });
    const sumDep = deps.reduce(function (s, d) { return s + d; }, 0);

    function pickItem() { return pick(ITEMS_DECLINING_OK); }

    const costs = deps.map(function (d, i) { return buildCostFromDep(d, residualRates[i]); });
    let sharedAcq, acqDateStr;
    if (useFYStart) {
      sharedAcq = pastFYStart(0);
      acqDateStr = dateStr(sharedAcq.year, sharedAcq.month);
    } else {
      const fyMonth = 13 - pf.months;
      sharedAcq = fyMonthToDate(CURRENT_FY, fyMonth);
      acqDateStr = dateStrAnyDay(sharedAcq.year, sharedAcq.month);
    }

    const rawAssets = [];
    for (let i = 0; i < N; i++) {
      rawAssets.push({ itemName: singleItem || groupItemForYears(years[i]), years: years[i], cost: costs[i].cost, residual: costs[i].residual, residualRate: residualRates[i], dep: deps[i], annual: annuals[i] });
    }
    const nameCounts = {};
    rawAssets.forEach(function (a) { nameCounts[a.itemName] = (nameCounts[a.itemName] || 0) + 1; });
    const nameOrder = [];
    rawAssets.forEach(function (a) { if (!nameOrder.includes(a.itemName)) nameOrder.push(a.itemName); });
    const grouped = rawAssets.slice().sort(function (a, b) { return nameOrder.indexOf(a.itemName) - nameOrder.indexOf(b.itemName); });
    const seenSoFar = {};
    const assets = grouped.map(function (a) {
      let label = a.itemName;
      if (nameCounts[a.itemName] > 1) {
        seenSoFar[a.itemName] = (seenSoFar[a.itemName] || 0) + 1;
        label = a.itemName + String.fromCharCode(64 + seenSoFar[a.itemName]);
      }
      return Object.assign({}, a, { item: label });
    });

    let rows = '';
    assets.forEach(function (a) {
      const residualLabel = a.residualRate === 0 ? '0' : '10%';
      rows += '<tr><td>' + a.item + '</td><td class="je-amt">' + yen(a.cost) + '</td><td class="je-amt">' + residualLabel + '</td><td class="je-amt">' + a.years + '年</td></tr>';
    });

    const actualAverageLife = Math.floor(sumDep / sumAnnual);
    const scaledLife = Math.floor(sumDep * 10000 / sumAnnual);
    const lifeIsExact = (sumDep * 10000) % sumAnnual === 0;
    const averageLifeDisplay = (scaledLife / 10000).toFixed(4) + (lifeIsExact ? '' : '…');
    const fullYearAnswer = sumDep / actualAverageLife;
    const answerCheck = useFYStart ? fullYearAnswer : Math.round(fullYearAnswer * pf.months / 12);

    const proRateSteps = useFYStart
      ? '<div class="step">総合償却費 = 要償却額合計 ÷ 平均耐用年数</div>' + '<div class="step formula">' + yen(sumDep) + ' ÷ ' + actualAverageLife + ' = ' + yen(fullYearAnswer) + '</div>'
      : '<div class="step">年間の総合償却費 = 要償却額合計 ÷ 平均耐用年数</div>' + '<div class="step">' + yen(sumDep) + ' ÷ ' + actualAverageLife + ' = ' + yen(fullYearAnswer) + '</div>' +
        '<div class="step">取得日から当期末までの使用月数は' + pf.months + 'か月なので月割計算する</div>' +
        '<div class="step formula">当期分 = ' + yen(fullYearAnswer) + ' × ' + pf.months + ' ÷ 12 = ' + yen(answerCheck) + '</div>';

    return {
      level: '1', category: '総合償却',
      question: acqDateStr + 'に次の' + N + 'つの資産を取得し、ひとつのグループとして総合償却する(各資産とも定額法、平均耐用年数は1年未満切り捨て)場合、当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。' +
        '<table class="je-table" style="margin-top:10px;"><tr><td style="text-align:center;font-weight:700;">資産</td><td class="je-amt" style="text-align:center;font-weight:700;">取得原価</td><td class="je-amt" style="text-align:center;font-weight:700;">残存価額</td><td class="je-amt" style="text-align:center;font-weight:700;">耐用年数</td></tr>' + rows + '</table>',
      answer: answerCheck,
      explain: '<div class="step">各資産ごとの要償却額(取得原価 − 残存価額)と年間償却費(要償却額 ÷ 耐用年数)を求める</div>' + buildGroupDepTable(assets, sumDep, sumAnnual) +
        '<div class="step">平均耐用年数 = 要償却額合計 ÷ 個別年間償却費合計</div>' + '<div class="step formula">' + yen(sumDep) + ' ÷ ' + yen(sumAnnual) + ' = ' + averageLifeDisplay + '年 → ' + actualAverageLife + '年(切り捨て)</div>' +
        proRateSteps
    };
  }

  /* ---------- 1級: 総合償却(期首一部除却・売却) ---------- */
  function genGroupDepreciationRetirement() {
    const averageLife = randInt(4, 15);
    const N = pick([3, 4, 5]);

    const uniformResidual = true;
    const residualRates = [];
    if (uniformResidual) {
      const r = pickResidualRate();
      for (let i = 0; i < N; i++) residualRates.push(r);
    } else {
      for (let i = 0; i < N; i++) residualRates.push(pickResidualRate());
    }
    const anyResidual = residualRates.some(function (r) { return r === 0.1; });
    const resMult = anyResidual ? 9 : 1;

    const minOffset = Math.max(-6, 3 - averageLife);
    const useSingleItem = Math.random() < 0.4;
    let singleItem = null;
    let offsets, years, zeroIdx, derivedIdx;
    let answer, sumAnnual, decrement, annuals = [], costsCheck;
    let outerTries = 0;
    let success = false;
    do {
      offsets = [0, 1];
      while (offsets.length < N) { offsets.push(randInt(minOffset, 8)); }
      for (let i = offsets.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = offsets[i]; offsets[i] = offsets[j]; offsets[j] = tmp;
      }
      years = offsets.map(function (o) { return averageLife + o; });
      singleItem = useSingleItem ? groupSingleItemForYears(years) : null;
      if (useSingleItem && !singleItem) { outerTries++; continue; }
      zeroIdx = offsets.indexOf(0);
      derivedIdx = offsets.indexOf(1);

      let tries = 0;
      let lifeOk = false;
      do {
        const ansBase = resMult * randInt(1500, 4500);
        answer = ansBase * 100;
        const decrementK = randInt(200, 400) * resMult;
        decrement = decrementK * 100;
        sumAnnual = answer - decrement;
        lifeOk = Math.floor(averageLife * answer / sumAnnual) === averageLife;

        if (lifeOk) {
          annuals = new Array(N).fill(0);
          let freeSum = 0;
          for (let i = 0; i < N; i++) {
            if (i === zeroIdx || i === derivedIdx) continue;
            const base = randInt(150, 350) * resMult;
            annuals[i] = base * 100;
            freeSum += annuals[i] * offsets[i];
          }
          annuals[derivedIdx] = averageLife * decrement - freeSum;
          const usedSum = annuals.reduce(function (s, v, i) { return i === zeroIdx ? s : s + v; }, 0);
          annuals[zeroIdx] = sumAnnual - usedSum;
        }
        tries++;
      } while ((!lifeOk || annuals.some(function (a) { return a <= 0; })) && tries < 2000);

      if (lifeOk && annuals && annuals.every(function (a) { return a > 0; })) {
        costsCheck = annuals.map(function (a, i) { return buildCostFromDep(a * years[i], residualRates[i]); });
        success = costsCheck.every(function (c) { return c.cost >= 100000; });
      } else {
        success = false;
      }
      outerTries++;
    } while (!success && outerTries < 600);

    const deps = annuals.map(function (a, i) { return a * years[i]; });
    const sumDep = deps.reduce(function (s, d) { return s + d; }, 0);
    const costs = deps.map(function (d, i) { return buildCostFromDep(d, residualRates[i]); });

    function pickItem() { return pick(ITEMS_DECLINING_OK); }

    const rawAssets = [];
    for (let i = 0; i < N; i++) {
      rawAssets.push({ itemName: singleItem || groupItemForYears(years[i]), years: years[i], cost: costs[i].cost, residual: costs[i].residual, residualRate: residualRates[i], dep: deps[i], annual: annuals[i], isRetired: i === zeroIdx });
    }
    const nameCounts = {};
    rawAssets.forEach(function (a) { nameCounts[a.itemName] = (nameCounts[a.itemName] || 0) + 1; });
    const nameOrder = [];
    rawAssets.forEach(function (a) { if (!nameOrder.includes(a.itemName)) nameOrder.push(a.itemName); });
    const grouped = rawAssets.slice().sort(function (a, b) { return nameOrder.indexOf(a.itemName) - nameOrder.indexOf(b.itemName); });
    const seenSoFar = {};
    const assets = grouped.map(function (a) {
      let label = a.itemName;
      if (nameCounts[a.itemName] > 1) {
        seenSoFar[a.itemName] = (seenSoFar[a.itemName] || 0) + 1;
        label = a.itemName + String.fromCharCode(64 + seenSoFar[a.itemName]);
      }
      return Object.assign({}, a, { item: label });
    });

    let rows = '';
    assets.forEach(function (a) {
      const residualLabel = a.residualRate === 0 ? '0' : '10%';
      rows += '<tr><td>' + a.item + '</td><td class="je-amt">' + yen(a.cost) + '</td><td class="je-amt">' + residualLabel + '</td><td class="je-amt">' + a.years + '年</td></tr>';
    });

    const retiredAsset = assets.filter(function (a) { return a.isRetired; })[0];
    const disposalType = Math.random() < 0.5 ? '除却' : '売却';

    let disposalLine, disposalProceeds, gainLossLabel, gainLossAmt, hasGainLoss;
    if (disposalType === '売却') {
      const residualBase = retiredAsset.residual / 100;
      const offsetK = randInt(-5, 5);
      disposalProceeds = Math.max(0, (residualBase + offsetK)) * 100;
      const gainLoss = disposalProceeds - retiredAsset.residual;
      hasGainLoss = gainLoss !== 0;
      gainLossLabel = gainLoss >= 0 ? '固定資産売却益' : '固定資産売却損';
      gainLossAmt = Math.abs(gainLoss);
      disposalLine = '売却価額' + yen(disposalProceeds) + 'で売却した';
    } else {
      disposalLine = '除却した';
      hasGainLoss = false;
    }

    const actualAverageLife = Math.floor(sumDep / sumAnnual);
    const fullYearAnswer = sumDep / actualAverageLife;
    const answerAfterRetirement = fullYearAnswer - annuals[zeroIdx];

    const acqFY = pastFYStart(randInt(1, Math.min(averageLife - 1, 8)));
    const acqDateStr = dateStr(acqFY.year, acqFY.month);

    const scaledLife = Math.floor(sumDep * 10000 / sumAnnual);
    const lifeIsExact = (sumDep * 10000) % sumAnnual === 0;
    const averageLifeDisplay = (scaledLife / 10000).toFixed(4) + (lifeIsExact ? '' : '…');



    return {
      level: '1', category: '総合償却(期首一部除却・売却)',
      question: acqDateStr + 'に次の' + N + 'つの資産を取得し、平均耐用年数によりひとつのグループとして総合償却してきた(各資産とも定額法、平均耐用年数は1年未満切り捨て)。当期首に、' + retiredAsset.item + 'を' + disposalLine + '。下記の資産について、当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。' +
        '<table class="je-table" style="margin-top:10px;"><tr><td style="text-align:center;font-weight:700;">資産</td><td class="je-amt" style="text-align:center;font-weight:700;">取得原価</td><td class="je-amt" style="text-align:center;font-weight:700;">残存価額</td><td class="je-amt" style="text-align:center;font-weight:700;">耐用年数</td></tr>' + rows + '</table>',
      answer: answerAfterRetirement,
      explain: '<div class="step">各資産ごとの要償却額(取得原価 − 残存価額)と年間償却費(要償却額 ÷ 耐用年数)を求める</div>' + buildGroupDepTable(assets, sumDep, sumAnnual) +
        '<div class="step">平均耐用年数 = 要償却額合計 ÷ 個別年間償却費合計</div>' + '<div class="step formula">' + yen(sumDep) + ' ÷ ' + yen(sumAnnual) + ' = ' + averageLifeDisplay + '年 → ' + actualAverageLife + '年(切り捨て)</div>' +
        '<div class="step" style="margin-top:16px;">総合償却では、個々の資産の未償却残高は把握しない</div>' +
        '<div class="step">除却・売却した資産の要償却額(取得原価 − 残存価額)の全額を、減価償却累計額から取り崩す</div>' + '<div class="step formula">' + retiredAsset.item + 'の要償却額 = ' + yen(retiredAsset.cost) + ' − ' + yen(retiredAsset.residual) + ' = ' + yen(retiredAsset.dep) + '</div>' +
        (disposalType === '除却'
          ? '<div class="step">除却の場合、残存価額相当額は貯蔵品として計上するため、除却損益は生じない</div>'
          : (hasGainLoss
            ? (gainLossLabel === '固定資産売却損'
              ? '<div class="step">' + gainLossLabel + ' = 残存価額 − 売却価額 = ' + yen(retiredAsset.residual) + ' − ' + yen(disposalProceeds) + ' = ' + yen(gainLossAmt) + '</div>'
              : '<div class="step">' + gainLossLabel + ' = 売却価額 − 残存価額 = ' + yen(disposalProceeds) + ' − ' + yen(retiredAsset.residual) + ' = ' + yen(gainLossAmt) + '</div>')
            : '<div class="step">売却価額と残存価額が一致するため、売却損益は生じない</div>')) +
        '<div class="step" style="margin-top:16px;">除却・売却後の当期の減価償却費 = (要償却額の合計額 − 除却・売却した資産の要償却額) ÷ 平均耐用年数</div>' +
        '<div class="step formula">(' + yen(sumDep) + ' − ' + yen(retiredAsset.dep) + ') ÷ ' + actualAverageLife + ' = ' + yen(answerAfterRetirement) + '</div>'
    };
  }

  /* ---------- 1級: 資本的支出と修繕費の按分 ---------- */
  function genCapitalExpenditure() {
    const item = pick(['建物', '建物附属設備', '構築物', '機械装置']);
    const rOld = item === '建物' ? randInt(18, 30) : (item === '建物附属設備' || item === '構築物') ? randInt(9, 18) : randInt(3, 8);
    const ext = randInt(1, 4);
    const rNew = rOld + ext;
    const elapsed = randInt(2, 6);
    const totalYears = rOld + elapsed;
    const acq = pastFYStart(elapsed);
    const residualRate = pickResidualRate();

    let originalCost, residual, annualDepBefore, B;
    if (residualRate === 0) {
      const need = rNew / gcd(rOld, rNew);
      const unitCost = totalYears * need * 100;
      const kMultiplier = Math.max(2, Math.ceil(500000 / unitCost));
      const kMax = item === '建物' ? Math.max(kMultiplier + 20, Math.floor(2000000000 / unitCost)) : kMultiplier + 20;
      const k = need * randInt(kMultiplier, kMax);
      originalCost = totalYears * k * 100;
      annualDepBefore = originalCost / totalYears;
      residual = 0;
      B = originalCost - annualDepBefore * elapsed;
    } else {
      const g = gcd(9, 10 * totalYears);
      const D = (10 * totalYears) / g;
      const Abase = (9 / g) * 100;
      const need = rNew / gcd(Abase * rOld, rNew);
      const unitCost = D * need * 100;
      const kMultiplier = Math.max(2, Math.ceil(500000 / unitCost));
      const kMax = item === '建物' ? Math.max(kMultiplier + 20, Math.floor(2000000000 / unitCost)) : kMultiplier + 20;
      const k = need * randInt(kMultiplier, kMax);
      originalCost = D * k * 100;
      annualDepBefore = 9 * originalCost / (10 * totalYears);
      residual = originalCost * 0.1;
      B = originalCost - annualDepBefore * elapsed;
    }

    const targetRatio = 0.2 + Math.random() * 0.4;
    const targetSpend = originalCost * targetRatio;
    const mRaw = Math.max(1, Math.round(targetSpend / rNew / 100 / rNew));
    const m = rNew * mRaw;
    const totalSpend = m * rNew * 100;
    const capitalPortion = ext * m * 100;
    const repairExpense = totalSpend - capitalPortion;
    const capitalResidual = residualRate === 0 ? 0 : capitalPortion * 0.1;
    const newResidual = residual + capitalResidual;
    const newBasis = B + capitalPortion - newResidual;
    const answer = newBasis / rNew;

    return {
      level: '1', category: '資本的支出と修繕費の按分',
      question: dateStr(acq.year, acq.month) + 'に取得した' + item + '(取得原価 ' + yen(originalCost) + '、耐用年数 ' + totalYears + '年、' + residualText(residualRate) + '、定額法により償却)について、当期首(' + fyStartDateStr(CURRENT_FY) + ')に' + yen(totalSpend) + 'を支出して改良を行い、耐用年数が' + ext + '年延長された。支出額を資本的支出と修繕費(収益的支出)に区別したうえで、当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。',
      answer,
      explain: '<div class="step">改良前の残存耐用年数 = 耐用年数 − 経過年数 = ' + totalYears + '年 − ' + elapsed + '年 = ' + rOld + '年</div>' +
        '<div class="step">改良後の残存耐用年数 = 改良前の残存耐用年数 + 延長年数 = ' + rOld + '年 + ' + ext + '年 = ' + rNew + '年</div>' +
        (residual === 0
          ? '<div class="step" style="margin-top:16px;">改良前の年間減価償却費 = 取得原価 ÷ 耐用年数</div>' +
            '<div class="step">' + yen(originalCost) + ' ÷ ' + totalYears + ' = ' + yen(annualDepBefore) + '</div>'
          : '<div class="step" style="margin-top:16px;">改良前の年間減価償却費 = (取得原価 − 残存価額) ÷ 耐用年数</div>' +
            '<div class="step">(' + yen(originalCost) + ' − ' + yen(residual) + ') ÷ ' + totalYears + ' = ' + yen(annualDepBefore) + '</div>') +
        '<div class="step">当期首の帳簿価額 = 取得原価 − 減価償却累計額</div>' + '<div class="step">' + yen(originalCost) + ' − ' + yen(annualDepBefore) + ' × ' + elapsed + '年 = ' + yen(B) + '</div>' +
        '<div class="step" style="margin-top:16px;">資本的支出額 = 支出総額 × 延長年数 ÷ 改良後の残存耐用年数</div>' + '<div class="step formula">' + yen(totalSpend) + ' × ' + ext + ' ÷ ' + rNew + ' = ' + yen(capitalPortion) + '</div>' +
        '<div class="step">修繕費(収益的支出) = 支出総額 − 資本的支出額</div>' +
        '<div class="step">' + yen(totalSpend) + ' − ' + yen(capitalPortion) + ' = ' + yen(repairExpense) + '</div>' +
        '<div class="step" style="margin-top:16px;">改定後の未償却残高 = 期首帳簿価額 + 資本的支出額</div>' + '<div class="step formula">' + yen(B) + ' + ' + yen(capitalPortion) + ' = ' + yen(B + capitalPortion) + '</div>' +
        (residualRate === 0
          ? ''
          : '<div class="step">改定後の残存価額 = 当初の残存価額 + 資本的支出額 × 10%</div>' + '<div class="step">' + yen(residual) + ' + (' + yen(capitalPortion) + ' × 10%) = ' + yen(residual) + ' + ' + yen(capitalResidual) + ' = ' + yen(newResidual) + '</div>') +
        (newResidual === 0
          ? '<div class="step" style="margin-top:16px;">当期の減価償却費 = 改定後の未償却残高 ÷ 改良後の残存耐用年数</div>' +
            '<div class="step formula">' + yen(B + capitalPortion) + ' ÷ ' + rNew + ' = ' + yen(answer) + '</div>'
          : '<div class="step" style="margin-top:16px;">当期の減価償却費 = (改定後の未償却残高 − 改定後の残存価額) ÷ 改良後の残存耐用年数</div>' +
            '<div class="step formula">(' + yen(B + capitalPortion) + ' − ' + yen(newResidual) + ') ÷ ' + rNew + ' = ' + yen(answer) + '</div>')
    };
  }


  /* ---------- 1級: 車両の買い替え(当期分の減価償却費) ---------- */
  function genAssetTradeInCore(hasFairValue) {
    const item = pick(ITEMS_DECLINING_OK);
    // 期中の買換え(約半分):新資産は取得日から当期末までの月割で償却する
    const useMid = Math.random() < 0.5;
    const months = useMid ? randInt(1, 11) : 12;
    const monthMult = 12 / gcd(12, months);

    const useDecliningNew = Math.random() < 0.4;
    let yearsNew, residualRateNew, rateNew, newCost, residualNew, annualNew;
    let newVehicleTries = 0;
    if (useDecliningNew) {
      do {
        const DECL = { 4: 0.5, 5: 0.4, 8: 0.25, 10: 0.2 };
        yearsNew = pick(Object.keys(DECL).map(Number));
        rateNew = DECL[yearsNew];
        residualRateNew = pickResidualRate();
        const costBase = monthMult * randInt(Math.ceil(5000 / monthMult), Math.floor(80000 / monthMult));
        newCost = costBase * 100;
        annualNew = newCost * rateNew;
        residualNew = 0;
        newVehicleTries++;
      } while (newCost > 9000000 && newVehicleTries < 100);
    } else {
      let factor, unitCost, multiplierNew, annualBaseNew, depNew;
      do {
        yearsNew = pick(YEARS);
        residualRateNew = pickResidualRate();
        factor = residualRateNew === 0 ? yearsNew : lcm(yearsNew, 9);
        unitCost = buildCostFromDep(factor * 100 * yearsNew, residualRateNew).cost;
        const targetVehicleCost = randInt(50, 800) * 10000;
        multiplierNew = Math.max(monthMult, Math.round(targetVehicleCost / unitCost / monthMult) * monthMult);
        annualBaseNew = factor * multiplierNew;
        annualNew = annualBaseNew * 100;
        depNew = annualNew * yearsNew;
        const built = buildCostFromDep(depNew, residualRateNew);
        newCost = built.cost;
        residualNew = built.residual;
        newVehicleTries++;
      } while (newCost > 9000000 && newVehicleTries < 100);
    }
    const answer = annualNew * months / 12;

    let tradeInAllowance, cashPaid, newVehiclePrice, fairValue, discount;
    if (hasFairValue) {
      const cashRatioBase = randInt(2, 6);
      cashPaid = Math.round(newCost * cashRatioBase / 10 / 100) * 100;
      fairValue = newCost - cashPaid;
      discount = Math.max(100, Math.round(fairValue * randInt(1, 4) / 10 / 100) * 100);
      tradeInAllowance = fairValue + discount;
      newVehiclePrice = tradeInAllowance + cashPaid;
    } else {
      const tradeInRatioBase = randInt(3, 7);
      tradeInAllowance = Math.round(newCost * tradeInRatioBase / 10 / 100) * 100;
      cashPaid = newCost - tradeInAllowance;
      newVehiclePrice = newCost;
    }

    // 答えが差額の現金と同じ金額になる場合は作り直す(問題文の金額をそのまま書いて正解にならないように)
    if (cashPaid === answer) return genAssetTradeInCore(hasFairValue);

    // 旧資産:帳簿価額が下取価格(1級は時価)の0.6〜1.4倍程度になるように決める
    const oldBase = hasFairValue ? fairValue : tradeInAllowance;
    const oldBookValue = Math.max(100, Math.round(oldBase * randInt(60, 140) / 100 / 100) * 100);
    const accumRatio = randInt(2, 8) / 10;
    const oldCost = Math.max(oldBookValue + 100, Math.round(oldBookValue / (1 - accumRatio) / 100) * 100);
    const oldAccumDep = oldCost - oldBookValue;

    const tradeD = fyMonthToDate(CURRENT_FY, 13 - months);
    const tradeDateText = dateStr(tradeD.year, tradeD.month);

    const fairValueClause = hasFairValue ? '(時価 ' + yen(fairValue) + ')' : '';
    const costSteps = hasFairValue
      ? '<div class="step">下取価格が時価を上回っている場合、その差額は新' + item + 'の値引きとして処理する</div>' +
        '<div class="step">値引き額 = 下取価格 − 時価</div>' +
        '<div class="step">' + yen(tradeInAllowance) + ' − ' + yen(fairValue) + ' = ' + yen(discount) + '</div>' +
        '<div class="step">新' + item + 'の取得原価 = 時価 + 現金支払額(下取価格ではなく時価を用いる)</div>' +
        '<div class="step formula">' + yen(fairValue) + ' + ' + yen(cashPaid) + ' = ' + yen(newCost) + '</div>'
      : '<div class="step">新' + item + 'の取得原価 = 下取価格 + 現金支払額</div>' +
        '<div class="step formula">' + yen(tradeInAllowance) + ' + ' + yen(cashPaid) + ' = ' + yen(newCost) + '</div>';
    const rateSteps = useDecliningNew
      ? '<div class="step">定率法では残存価額は計算に使用しない</div>' +
        '<div class="step">200%定率法の償却率 = 1 ÷ 耐用年数' + yearsNew + '年 × 200% = ' + rateNew + '</div>'
      : '';
    const labelFormula = useDecliningNew ? '取得原価 × 償却率' : (residualNew === 0 ? '取得原価 ÷ 耐用年数' : '(取得原価 − 残存価額) ÷ 耐用年数');
    const calcText = useDecliningNew ? yen(newCost) + ' × ' + rateNew : (residualNew === 0 ? yen(newCost) + ' ÷ ' + yearsNew : '(' + yen(newCost) + ' − ' + yen(residualNew) + ') ÷ ' + yearsNew);
    const depSteps = useMid
      ? '<div class="step" style="margin-top:16px;">新' + item + 'の取得日(' + tradeDateText + ')から当期末までの使用月数は' + months + 'か月なので月割計算する</div>' +
        rateSteps +
        '<div class="step">年間の減価償却費 = ' + labelFormula + '</div>' +
        '<div class="step">' + calcText + ' = ' + yen(annualNew) + '</div>' +
        '<div class="step formula">当期分 = ' + yen(annualNew) + ' × ' + months + ' ÷ 12 = ' + yen(answer) + '</div>'
      : '<div class="step" style="margin-top:16px;">新' + item + 'は当期首(' + tradeDateText + ')に取得しているため、当期は1年分の減価償却費を計上する</div>' +
        rateSteps +
        '<div class="step">当期の減価償却費 = ' + labelFormula + '</div>' +
        '<div class="step formula">' + calcText + ' = ' + yen(answer) + '</div>';

    return {
      level: hasFairValue ? '1' : '2', category: '固定資産の買換え(新資産の当期減価償却費)',
      question: tradeDateText + 'に旧' + item + '(取得原価 ' + yen(oldCost) + '、減価償却累計額 ' + yen(oldAccumDep) + ')を' + yen(tradeInAllowance) + '' + fairValueClause + 'で下取りに出し、' + yen(newVehiclePrice) + 'の新' + item + '(' + residualText(residualRateNew) + '、耐用年数 ' + yearsNew + '年、' + (useDecliningNew ? '200%定率法' : '定額法') + 'により償却)を取得し、差額の現金' + yen(cashPaid) + 'を支払った。新' + item + 'にかかる当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。',
      answer,
      explain: costSteps + depSteps
    };
  }

  function genAssetTradeInWithFairValue() {
    return genAssetTradeInCore(true);
  }

  function genAssetTradeInNoFairValue() {
    return genAssetTradeInCore(false);
  }

  /* ---------- 1級: 減価償却方法の変更(定率法→定額法) ---------- */
  function genMethodChange() {
    const item = pick(ITEMS_DECLINING_OK);
    const DECL = { 4: 0.5, 5: 0.4, 8: 0.25, 10: 0.2 };
    const totalYears = pick(Object.keys(DECL).map(Number));
    const rate = DECL[totalYears];
    const oneMinusFrac = { 0.5: [1, 2], 0.4: [3, 5], 0.25: [3, 4], 0.2: [4, 5] };
    const rateFrac = { 0.5: [1, 2], 0.4: [2, 5], 0.25: [1, 4], 0.2: [1, 5] };
    const [oNumer, oDenom] = oneMinusFrac[rate];
    const [rNumer, rDenom] = rateFrac[rate];
    const e = pick([1, 2]);
    const residualRate = pickResidualRate();
    const acqPeriodMC = determineAcqPeriod(0.4, 0);
    const useFYStart = acqPeriodMC.useFYStart;

    let cost, BVe, mcRows, mcFirstMonths, acqDateStr, remainingMonths, elapsedMonthsTotal;
    if (useFYStart) {
      const denomPow = Math.pow(oDenom, e);
      const numerPow = Math.pow(oNumer, e);
      const kMin = Math.max(200, Math.ceil(1000 / denomPow));
      const k = randInt(kMin, Math.max(kMin + 100, 1200));
      cost = denomPow * k * 100;
      BVe = numerPow * k * 100;
      const acq = pastFYStart(e);
      acqDateStr = dateStr(acq.year, acq.month);
      mcRows = [];
      let bv = cost;
      for (let y = 1; y <= e; y++) {
        const newBv = Math.round(bv * (1 - rate));
        mcRows.push({ method: '定率法', beginningBV: bv, depreciation: bv - newBv, endingBV: newBv });
        bv = newBv;
      }
      BVe = bv;
      elapsedMonthsTotal = e * 12;
      remainingMonths = totalYears * 12 - elapsedMonthsTotal;
    } else {
      const months = acqPeriodMC.months;
      const fullYearsAfterFirst = e - 1;
      const P1_denom = rDenom * 12;
      const D = P1_denom * Math.pow(oDenom, fullYearsAfterFirst);
      const kMin2 = Math.max(200, Math.ceil(1000 / D));
      const k = randInt(kMin2, Math.max(kMin2 + 100, 1200));
      cost = D * k * 100;
      const dep1 = cost * rNumer * months / P1_denom;
      let bv = cost - dep1;
      mcFirstMonths = months;
      mcRows = [{ method: '定率法', beginningBV: cost, depreciation: dep1, endingBV: bv, months: months }];
      for (let y = 0; y < fullYearsAfterFirst; y++) {
        const nb = bv * oNumer / oDenom;
        mcRows.push({ method: '定率法', beginningBV: bv, depreciation: bv - nb, endingBV: nb });
        bv = nb;
      }
      BVe = bv;
      const fyStart = fyMonthToDate(CURRENT_FY, 1);
      const fyStartAbs = fyStart.year * 12 + (fyStart.month - 1);
      const acqAbs = fyStartAbs - ((e - 1) * 12 + months);
      const acqYear = Math.floor(acqAbs / 12);
      const acqMonth = acqAbs - acqYear * 12 + 1;
      acqDateStr = dateStrAnyDay(acqYear, acqMonth);
      elapsedMonthsTotal = months + (e - 1) * 12;
      remainingMonths = totalYears * 12 - elapsedMonthsTotal;
    }
    const residualAmt = residualRate === 0 ? 0 : Math.round(cost * 0.1);
    const depreciableRemaining = BVe - residualAmt;
    const answer = Math.floor(depreciableRemaining / remainingMonths * 12);
    mcRows.push({ method: '定額法', beginningBV: BVe, depreciation: answer, endingBV: BVe - answer });

    return {
      level: '1', category: '減価償却方法の変更(定率法→定額法)',
      question: acqDateStr + 'に取得した' + item + '(取得原価 ' + yen(cost) + '、' + residualText(residualRate) + '、耐用年数 ' + totalYears + '年)について、取得後は定率法(償却率 ' + rate + ')により償却してきたが、' + fyStartDateStr(CURRENT_FY) + '(当期首)から定額法に変更することとした。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい(円未満切り捨て)。',
      answer,
      explain: '<div class="step">取得日から当期首までの期間をもとに、定率法で帳簿価額を計算する' + (useFYStart ? '' : '(初年度' + mcFirstMonths + 'か月分は月割計算)') + '</div>' +
        buildMethodChangeTable(mcRows) +
        '<div class="step">減価償却方法の変更は、会計上の見積りの変更と同様に当期首から将来に向かって適用する(過去の減価償却費は修正しない)</div>' +
        (useFYStart
          ? '<div class="step">方法変更時点の帳簿価額は' + yen(BVe) + '</div>' +
            '<div class="step">残存耐用年数 = ' + totalYears + '年 − ' + e + '年 = ' + (remainingMonths / 12) + '年</div>' +
            '<div class="step" style="margin-top:16px;">当期の減価償却費 = ' + (residualAmt === 0 ? '方法変更時点の帳簿価額' : '(方法変更時点の帳簿価額 − 残存価額)') + ' ÷ 残存耐用年数</div>' +
            '<div class="step formula">' + (residualAmt === 0 ? yen(BVe) : '(' + yen(BVe) + ' − ' + yen(residualAmt) + ')') + ' ÷ ' + (remainingMonths / 12) + ' = ' + yen(answer) + '</div>'
          : '<div class="step">方法変更時点の帳簿価額は' + yen(BVe) + '</div>' +
            '<div class="step">初年度が月割のため、残存耐用年数も月数で計算する</div>' +
            '<div class="step">耐用年数' + totalYears + '年 = ' + (totalYears * 12) + 'か月</div>' +
            '<div class="step">取得日から当期首(方法変更時)までの経過期間 = ' + elapsedPeriodText(elapsedMonthsTotal) + '</div>' +
            '<div class="step">残存耐用年数 = ' + (totalYears * 12) + 'か月 − ' + elapsedMonthsTotal + 'か月 = ' + remainingMonths + 'か月(' + ymText(remainingMonths) + ')</div>' +
            '<div class="step" style="margin-top:16px;">当期の減価償却費 = ' + (residualAmt === 0 ? '方法変更時点の帳簿価額' : '(方法変更時点の帳簿価額 − 残存価額)') + ' ÷ 残存耐用年数(月数) × 12か月</div>' +
            '<div class="step formula">' + (residualAmt === 0 ? yen(BVe) : '(' + yen(BVe) + ' − ' + yen(residualAmt) + ')') + ' ÷ ' + remainingMonths + 'か月 × 12か月 = ' + yen(answer) + '</div>')
    };
  }

  /* ---------- 1級: 減価償却方法の変更(定額法→定率法) ---------- */
  function genMethodChangeToDeclining() {
    const item = pick(ITEMS_DECLINING_OK);
    const DECL = { 4: 0.5, 5: 0.4, 8: 0.25, 10: 0.2 };
    const totalYears = pick(Object.keys(DECL).map(Number));
    const rate = DECL[totalYears];
    const e = pick([1, 2]);
    const residualRate = pickResidualRate();
    const useFYStart = Math.random() < 0.4;

    let cost, residual, annual, BVe, acqDateStr, mcRows, elapsedMonthsTotal, months;
    const factor = residualRate === 0 ? 1 : 9;
    if (useFYStart) {
      const annualBase = randInt(200, 1200) * factor;
      annual = annualBase * 100;
      const dep = annual * totalYears;
      const built = buildCostFromDep(dep, residualRate);
      cost = built.cost; residual = built.residual;
      const acq = pastFYStart(e);
      acqDateStr = dateStr(acq.year, acq.month);
      mcRows = [];
      let bv = cost;
      for (let y = 1; y <= e; y++) {
        const newBv = bv - annual;
        mcRows.push({ method: '定額法', beginningBV: bv, depreciation: annual, endingBV: newBv });
        bv = newBv;
      }
      BVe = bv;
    } else {
      const useFixedMidYearDate = Math.random() < 0.5;
      months = useFixedMidYearDate ? (fixedTrapMonths()) : randInt(1, 11);
      const monthMult = 12 / gcd(12, months);
      const annualBase = randInt(200, 1200) * monthMult * factor;
      annual = annualBase * 100;
      const dep = annual * totalYears;
      const built = buildCostFromDep(dep, residualRate);
      cost = built.cost; residual = built.residual;
      const dep1 = annual * months / 12;
      let bv = cost - dep1;
      mcRows = [{ method: '定額法', beginningBV: cost, depreciation: dep1, endingBV: bv, months: months }];
      for (let y = 0; y < e - 1; y++) {
        const nb = bv - annual;
        mcRows.push({ method: '定額法', beginningBV: bv, depreciation: annual, endingBV: nb });
        bv = nb;
      }
      BVe = bv;
      const fyStart = fyMonthToDate(CURRENT_FY, 1);
      const fyStartAbs = fyStart.year * 12 + (fyStart.month - 1);
      const acqAbs = fyStartAbs - ((e - 1) * 12 + months);
      const acqYear = Math.floor(acqAbs / 12);
      const acqMonth = acqAbs - acqYear * 12 + 1;
      acqDateStr = useFixedMidYearDate ? dateStr(acqYear, acqMonth) : dateStrAnyDay(acqYear, acqMonth);
      elapsedMonthsTotal = months + (e - 1) * 12;
    }
    const answer = Math.round(BVe * rate);
    mcRows.push({ method: '定率法', beginningBV: BVe, depreciation: answer, endingBV: BVe - answer });

    return {
      level: '1', category: '減価償却方法の変更(定額法→定率法)',
      question: acqDateStr + 'に取得した' + item + '(取得原価 ' + yen(cost) + '、' + residualText(residualRate) + '、耐用年数 ' + totalYears + '年)について、取得後は定額法により償却してきたが、' + fyStartDateStr(CURRENT_FY) + '(当期首)から定率法(償却率 ' + rate + ')に変更することとした。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい(円未満四捨五入)。',
      answer,
      explain: (residual === 0
          ? '<div class="step">年間の減価償却費(定額法) = 取得原価 ÷ 耐用年数</div><div class="step">' + yen(cost) + ' ÷ ' + totalYears + ' = ' + yen(annual) + '</div>'
          : '<div class="step">年間の減価償却費(定額法) = (取得原価 − 残存価額) ÷ 耐用年数</div><div class="step">(' + yen(cost) + ' − ' + yen(residual) + ') ÷ ' + totalYears + ' = ' + yen(annual) + '</div>') +
        '<div class="step">取得日から当期首までの期間をもとに、定額法で帳簿価額を計算する' + (useFYStart ? '' : '(初年度' + months + 'か月分は月割計算)') + '</div>' +
        buildMethodChangeTable(mcRows) +
        '<div class="step">減価償却方法の変更は、会計上の見積りの変更と同様に当期首から将来に向かって適用する(過去の減価償却費は修正しない)</div>' +
        '<div class="step">方法変更時点の帳簿価額は' + yen(BVe) + '</div>' +
        '<div class="step">変更後は定率法により償却し、残存価額は計算に使用しない</div>' +
        '<div class="step" style="margin-top:16px;">当期の減価償却費 = 方法変更時点の帳簿価額 × 償却率</div>' +
        '<div class="step formula">' + yen(BVe) + ' × ' + rate + ' = ' + yen(answer) + '</div>'
    };
  }

  /* ---------- 1級: 過去の減損損失を踏まえた減価償却費 ---------- */
  /* ---------- 1級: 耐用年数の見積り変更 ---------- */
  const ESTIMATE_CHANGE_REASONS = [
    '予測できなかった技術的な陳腐化が進んだため',
    '資産の利用状況の変化により、経済的使用可能予測期間を見直したため',
    '経年劣化の進行が当初の想定より早いことが判明したため',
    '資産の使用方法を変更したことに伴い、経済的使用可能予測期間を再検討したため'
  ];
  const BUILDING_ESTIMATE_CHANGE_REASONS = [
    '著しい老朽化が判明したため',
    '耐震診断の結果を踏まえ、経済的使用可能予測期間を見直したため',
    '建物の維持管理状況を踏まえ、経済的使用可能予測期間を再検討したため',
    '雨漏りなど劣化の進行が当初の想定より早いことが判明したため'
  ];
  function pickEstimateChangeReason(item) {
    return item === '建物' ? pick(BUILDING_ESTIMATE_CHANGE_REASONS) : pick(ESTIMATE_CHANGE_REASONS);
  }

  function genUsefulLifeChangeStraightRemaining() {
    const item = pick(ITEMS_TANGIBLE);
    const originalYears = yearsForItem(item, YEARS.filter(function (y) { return y >= 4; }));
    const totalMonths = originalYears * 12;
    const residualRate = pickResidualRate();
    const elapsedMonths = randInt(6, Math.min(96, totalMonths - 40));
    const remainingMonthsAtChange = totalMonths - elapsedMonths;
    const remainingYearsFloor = Math.floor(remainingMonthsAtChange / 12);
    const revisedRemainingYears = randInt(2, remainingYearsFloor - 1);

    const g1 = gcd(remainingMonthsAtChange, 12 * revisedRemainingYears);
    const need1 = (12 * revisedRemainingYears) / g1;
    const g2 = gcd(elapsedMonths, 12);
    const need2 = 12 / g2;
    let factor = lcm(need1, need2);
    if (residualRate === 0.1) factor = lcm(factor, 9);
    let annualBase;
    if (item === '建物') {
      const targetLow = 1000000, targetHigh = 2000000000;
      const lo = Math.max(1, Math.ceil(targetLow / originalYears / 100 / factor));
      const hi = Math.max(lo, Math.floor(targetHigh / originalYears / 100 / factor));
      annualBase = factor * randInt(lo, hi);
    } else {
      const loBase = Math.max(100, Math.ceil(120000 / originalYears / 100 / factor));
      annualBase = factor * randInt(loBase, Math.max(loBase + 100, 500));
    }
    const annualOld = annualBase * 100;
    const dep = annualOld * originalYears;
    const { cost, residual } = buildCostFromDep(dep, residualRate);
    const depToChange = annualOld * elapsedMonths / 12;
    const bookValueAtChange = cost - depToChange;
    const newDepreciable = annualOld * remainingMonthsAtChange / 12;
    const answer = newDepreciable / revisedRemainingYears;

    const fyStart = fyMonthToDate(CURRENT_FY, 1);
    const fyStartAbs = fyStart.year * 12 + (fyStart.month - 1);
    const acqAbs = fyStartAbs - elapsedMonths;
    const acqYear = Math.floor(acqAbs / 12);
    const acqMonth = acqAbs - acqYear * 12 + 1;
    const acqDateStr = dateStrAnyDay(acqYear, acqMonth);
    const reason = pickEstimateChangeReason(item);

    const monthsIntoFY = ((acqMonth - FY_START_MONTH + 12) % 12);
    const firstYearUsedMonths = 12 - monthsIntoFY;
    const changeTableRows = [];
    let bvChg = cost;
    if (elapsedMonths <= firstYearUsedMonths) {
      const dep1 = Math.round(annualOld * elapsedMonths / 12);
      changeTableRows.push({ beginningBV: bvChg, depreciation: dep1, endingBV: bvChg - dep1, hasImpairment: false, isProrated: true, months: elapsedMonths, remainingLife: originalYears + '年' });
      bvChg -= dep1;
    } else {
      const dep1 = Math.round(annualOld * firstYearUsedMonths / 12);
      changeTableRows.push({ beginningBV: bvChg, depreciation: dep1, endingBV: bvChg - dep1, hasImpairment: false, isProrated: true, months: firstYearUsedMonths, remainingLife: originalYears + '年' });
      bvChg -= dep1;
      const remainingAfterFirst = elapsedMonths - firstYearUsedMonths;
      const fullYears = remainingAfterFirst / 12;
      for (let y = 0; y < fullYears; y++) {
        const newBv = bvChg - annualOld;
        changeTableRows.push({ beginningBV: bvChg, depreciation: annualOld, endingBV: newBv, hasImpairment: false, remainingLife: (originalYears - y - 1) + '年' });
        bvChg = newBv;
      }
    }
    changeTableRows.push({ beginningBV: bvChg, depreciation: answer, endingBV: bvChg - answer, hasImpairment: false, remainingLife: revisedRemainingYears + '年' });
    const changeTable = buildImpairmentDecliningTable(changeTableRows, { eventRowLabel: '(変更時)', showEventColumn: false, showRemainingLifeCol: true });

    return {
      level: '1', category: '見積り変更(定額法・耐用年数)',
      question: acqDateStr + '取得の' + item + '(取得原価 ' + yen(cost) + '、' + residualText(residualRate) + '、取得時の耐用年数 ' + originalYears + '年、定額法により償却)について、' + fyStartDateStr(CURRENT_FY) + 'に、' + reason + '、残存耐用年数を' + revisedRemainingYears + '年に変更した。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。',
      answer,
      explain: (residual === 0
          ? '<div class="step">変更前の年間減価償却費 = 取得原価 ÷ 耐用年数</div><div class="step">' + yen(cost) + ' ÷ ' + originalYears + ' = ' + yen(annualOld) + '</div>'
          : '<div class="step">変更前の年間減価償却費 = (取得原価 − 残存価額) ÷ 耐用年数</div><div class="step">(' + yen(cost) + ' − ' + yen(residual) + ') ÷ ' + originalYears + ' = ' + yen(annualOld) + '</div>') +
        '<div class="step">取得日(' + acqDateStr + ')から変更日(' + fyStartDateStr(CURRENT_FY) + ')までの経過期間 = ' + elapsedPeriodText(elapsedMonths) + '</div>' +
        changeTable +
        '<div class="step">見積りの変更は将来に向かってのみ適用する(過去の減価償却費は修正しない)</div>' +
        (residual === 0
          ? '<div class="step">当期の減価償却費 = 変更時の帳簿価額 ÷ 変更後の残存耐用年数</div><div class="step formula">' + yen(bookValueAtChange) + ' ÷ ' + revisedRemainingYears + ' = ' + yen(answer) + '</div>'
          : '<div class="step">当期の減価償却費 = (変更時の帳簿価額 − 残存価額) ÷ 変更後の残存耐用年数</div><div class="step formula">(' + yen(bookValueAtChange) + ' − ' + yen(residual) + ') ÷ ' + revisedRemainingYears + ' = ' + yen(answer) + '</div>')
    };
  }

  function genUsefulLifeChangeStraightTotal() {
    const item = pick(ITEMS_TANGIBLE);
    const originalYears = yearsForItem(item, YEARS.filter(function (y) { return y >= 4; }));
    const residualRate = pickResidualRate();
    const elapsedYears = randInt(1, Math.min(8, originalYears - 3));
    const remainingAtChange = originalYears - elapsedYears;
    const revisedRemainingYears = randInt(2, remainingAtChange - 1);
    const newTotalYears = elapsedYears + revisedRemainingYears;

    const gcdWrong = gcd(remainingAtChange, newTotalYears);
    const wrongNeed = newTotalYears / gcdWrong;
    const baseFactor = residualRate === 0 ? revisedRemainingYears : lcm(revisedRemainingYears, 9);
    const factor = lcm(baseFactor, wrongNeed);
    let annualBase;
    if (item === '建物') {
      const targetLow = 1000000, targetHigh = 2000000000;
      const lo = Math.max(1, Math.ceil(targetLow / originalYears / 100 / factor));
      const hi = Math.max(lo, Math.floor(targetHigh / originalYears / 100 / factor));
      annualBase = factor * randInt(lo, hi);
    } else {
      const loBase = Math.max(100, Math.ceil(120000 / originalYears / 100 / factor));
      annualBase = factor * randInt(loBase, Math.max(loBase + 100, 800));
    }
    const annualOld = annualBase * 100;
    const dep = annualOld * originalYears;
    const { cost, residual } = buildCostFromDep(dep, residualRate);
    const depToChange = annualOld * elapsedYears;
    const bookValueAtChange = cost - depToChange;
    const newDepreciable = annualOld * remainingAtChange;
    const answer = newDepreciable / revisedRemainingYears;

    const acq = pastFYStart(elapsedYears);
    const acqDateStr = dateStrAnyDay(acq.year, acq.month);
    const reason = pickEstimateChangeReason(item);

    return {
      level: '1', category: '見積り変更(定額法・耐用年数)',
      question: acqDateStr + '取得の' + item + '(取得原価 ' + yen(cost) + '、' + residualText(residualRate) + '、取得時の耐用年数 ' + originalYears + '年、定額法により償却)について、' + fyStartDateStr(CURRENT_FY) + 'に、' + reason + '、耐用年数を' + newTotalYears + '年に変更した。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。',
      answer,
      explain: (residual === 0
          ? '<div class="step">変更前の年間減価償却費 = 取得原価 ÷ 耐用年数</div><div class="step">' + yen(cost) + ' ÷ ' + originalYears + ' = ' + yen(annualOld) + '</div>'
          : '<div class="step">変更前の年間減価償却費 = (取得原価 − 残存価額) ÷ 耐用年数</div><div class="step">(' + yen(cost) + ' − ' + yen(residual) + ') ÷ ' + originalYears + ' = ' + yen(annualOld) + '</div>') +
        buildImpairmentDecliningTable((function () {
          var rows = [];
          var bv = cost;
          for (var y = 1; y <= elapsedYears; y++) {
            var newBv = bv - annualOld;
            rows.push({ beginningBV: bv, depreciation: annualOld, endingBV: newBv, hasImpairment: false, remainingLife: (originalYears - y + 1) + '年' });
            bv = newBv;
          }
          rows.push({ beginningBV: bv, depreciation: answer, endingBV: bv - answer, hasImpairment: false, remainingLife: revisedRemainingYears + '年' });
          return rows;
        })(), { eventRowLabel: '(変更時)', showEventColumn: false, showRemainingLifeCol: true }) +
        '<div class="step">変更後の残存耐用年数 = 変更後の耐用年数 − 経過年数 = ' + newTotalYears + '年 − ' + elapsedYears + '年 = ' + revisedRemainingYears + '年</div>' +
        '<div class="step">見積りの変更は将来に向かってのみ適用する(過去の減価償却費は修正しない)</div>' +
        (residual === 0
          ? '<div class="step">当期の減価償却費 = 変更時の帳簿価額 ÷ 変更後の残存耐用年数</div><div class="step formula">' + yen(bookValueAtChange) + ' ÷ ' + revisedRemainingYears + ' = ' + yen(answer) + '</div>'
          : '<div class="step">当期の減価償却費 = (変更時の帳簿価額 − 残存価額) ÷ 変更後の残存耐用年数</div><div class="step formula">(' + yen(bookValueAtChange) + ' − ' + yen(residual) + ') ÷ ' + revisedRemainingYears + ' = ' + yen(answer) + '</div>')
    };
  }


  function genUsefulLifeChangeDeclining() {
    const item = pick(['備品', '車両運搬具', '機械装置']);
    const DECL = { 4: 0.5, 5: 0.4, 8: 0.25, 10: 0.2 };
    const rateFrac = { 0.5: [1, 2], 0.4: [2, 5], 0.25: [1, 4], 0.2: [1, 5] };
    const oneMinusFrac = { 0.5: [1, 2], 0.4: [3, 5], 0.25: [3, 4], 0.2: [4, 5] };

    const originalYears = pick([8, 10]);
    const oldRate = DECL[originalYears];
    const [rNumer, rDenom] = rateFrac[oldRate];
    const [oNumer, oDenom] = oneMinusFrac[oldRate];

    const { months: monthsInFirstYear, multipleNeeded } = periodFactor();
    const fullYearsElapsed = randInt(1, 2);
    const totalFYSpan = fullYearsElapsed + 1;
    const remainingYearsAtChange = originalYears - totalFYSpan;
    const revisedRemainingYears = pick(Object.keys(DECL).map(Number).filter(function (y) { return y < remainingYearsAtChange; }));
    const newRate = DECL[revisedRemainingYears];
    const [nNumer, nDenom] = rateFrac[newRate];
    const residualRate = pickResidualRate();

    const P1_denom = rDenom * 12;
    const D = P1_denom * Math.pow(oDenom, fullYearsElapsed) * nDenom;
    const k = randInt(100, 300);
    const cost = D * k * 100;

    const dep1 = cost * rNumer * monthsInFirstYear / P1_denom;
    let bv = cost - dep1;
    const tableRowsULC = [{ beginningBV: cost, depreciation: dep1, endingBV: bv, isProrated: true, months: monthsInFirstYear, remainingLife: originalYears + '年' }];
    for (let y = 1; y <= fullYearsElapsed; y++) {
      const nb = bv * oNumer / oDenom;
      tableRowsULC.push({ beginningBV: bv, depreciation: bv - nb, endingBV: nb, remainingLife: (originalYears - y) + '年', hasImpairment: false });
      bv = nb;
    }
    const bookValueAtChange = bv;
    const answer = bookValueAtChange * nNumer / nDenom;
    tableRowsULC.push({ beginningBV: bookValueAtChange, depreciation: answer, endingBV: bookValueAtChange - answer, remainingLife: revisedRemainingYears + '年' });
    let steps = buildImpairmentDecliningTable(tableRowsULC, { eventRowLabel: '(変更時)', showEventColumn: false, showRemainingLifeCol: true });

    const fyStart = fyMonthToDate(CURRENT_FY, 1);
    const fyStartAbs = fyStart.year * 12 + (fyStart.month - 1);
    const totalMonthsBeforeChange = fullYearsElapsed * 12 + monthsInFirstYear;
    const acqAbs = fyStartAbs - totalMonthsBeforeChange;
    const acqYear = Math.floor(acqAbs / 12);
    const acqMonth = acqAbs - acqYear * 12 + 1;
    const reason = pickEstimateChangeReason(item);

    return {
      level: '1', category: '見積り変更(定率法・耐用年数)',
      question: dateStrAnyDay(acqYear, acqMonth) + '取得の' + item + '(取得原価 ' + yen(cost) + '、' + residualText(residualRate) + '、取得時の耐用年数 ' + originalYears + '年、200%定率法により償却)について、' + fyStartDateStr(CURRENT_FY) + 'に、' + reason + '、残存耐用年数を' + revisedRemainingYears + '年に変更した。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。',
      answer,
      explain: '<div class="step">定率法では残存価額は計算に使用しない</div>' +
        '<div class="step">取得時の償却率 = 1 ÷ 耐用年数' + originalYears + '年 × 200% = ' + oldRate + '</div>' +
        '<div class="step">取得日から変更日までの経過期間は' + ymText(totalMonthsBeforeChange) + '(' + totalMonthsBeforeChange + 'か月)であり、初年度は月割で計算する</div>' +
        steps +
        '<div class="step">見積りの変更は将来に向かってのみ適用する(過去の減価償却費は修正しない)</div>' +
        '<div class="step">変更後の償却率 = 1 ÷ 耐用年数' + revisedRemainingYears + '年 × 200% = ' + newRate + '</div>' +
        '<div class="step">当期の減価償却費 = 変更時の帳簿価額 × 変更後の償却率</div>' + '<div class="step formula">' + yen(bookValueAtChange) + ' × ' + newRate + ' = ' + yen(answer) + '</div>'
    };
  }

  /* ---------- 1級: 過去の減損損失を踏まえた減価償却費 ---------- */
  function genImpairment() {
    const item = pick(ITEMS_TANGIBLE);
    const years = yearsForItem(item, YEARS);
    const e1 = randInt(2, Math.max(2, Math.min(5, years - 3)));
    const remainingAtImpairment = years - e1;
    const residualRate = pickResidualRate();

    const useFYStart = Math.random() < 0.6;
    let months, useFixedMidYearDate = false;
    if (useFYStart) {
      months = 12;
    } else {
      useFixedMidYearDate = Math.random() < 0.5;
      if (useFixedMidYearDate) {
        months = fixedTrapMonths();
      } else {
        months = randInt(1, 11);
      }
    }
    const monthMult = useFYStart ? 1 : 12 / gcd(12, months);

    let originalCost, residual, annual;
    if (residualRate === 0) {
      const annualBaseMin = Math.max(item === '建物' ? 20 : 6, Math.ceil(100000 / years / 100 / monthMult));
      const annualBaseMaxCap = 2000;
      const annualBaseMax = Math.max(annualBaseMaxCap, annualBaseMin + (item === '建物' ? 200 : 1000));
      const annualBase = randInt(annualBaseMin, annualBaseMax) * monthMult;
      annual = annualBase * 100;
      originalCost = annual * years;
      residual = 0;
    } else {
      const g1 = gcd(9, 10 * years);
      const D1 = (10 * years) / g1;
      const D2 = 10 * remainingAtImpairment;
      const D = lcm(D1, D2);
      const unitCostImp = D * 10;
      const kMaxBase = item === '建物' ? Math.floor(2000000000 / (unitCostImp * monthMult)) : 3000;
      const kMinForTargetBase = Math.ceil(100000 / (D * 10 * monthMult));
      const kMinBase = Math.max(20, kMinForTargetBase);
      const kMaxAdj = Math.max(kMaxBase, kMinBase + 180);
      const kBase = randInt(kMinBase, kMaxAdj);
      const k = kBase * monthMult;
      originalCost = D * k * 10;
      annual = 9 * originalCost / (10 * years);
      residual = originalCost * 0.1;
    }

    const remainingMonths = (years - e1 + 1) * 12 - months;
    const tableRowsSL = [];
    let bvSL = originalCost;
    if (useFYStart) {
      for (let y = 1; y <= e1; y++) {
        const newBv = bvSL - annual;
        tableRowsSL.push({ beginningBV: bvSL, depreciation: annual, endingBV: newBv, hasImpairment: false });
        bvSL = newBv;
      }
    } else {
      const dep1 = Math.round(annual * months / 12);
      const bvAfterFirst = bvSL - dep1;
      tableRowsSL.push({ beginningBV: bvSL, depreciation: dep1, endingBV: bvAfterFirst, hasImpairment: false, isProrated: true, months: months });
      bvSL = bvAfterFirst;
      for (let y = 0; y < e1 - 1; y++) {
        const newBv = bvSL - annual;
        tableRowsSL.push({ beginningBV: bvSL, depreciation: annual, endingBV: newBv, hasImpairment: false });
        bvSL = newBv;
      }
    }
    const bvAtImpairment = bvSL;
    const availableForImpairment = bvAtImpairment - residual;
    const remainder = availableForImpairment % remainingMonths;
    const adjustedAvailable = availableForImpairment - remainder;
    const unitCount = adjustedAvailable / remainingMonths / 100;
    const safeMaxUnit = Math.max(1, Math.floor(unitCount) - 1);
    const maxK = Math.min(safeMaxUnit, Math.floor(unitCount * 0.7));
    const minK = Math.max(1, Math.min(safeMaxUnit, Math.floor(unitCount * 0.2)));
    const impairmentK = randInt(minK, Math.max(minK, maxK));
    const impairmentAmount = impairmentK * remainingMonths * 100 + remainder;
    const newBasis = bvAtImpairment - impairmentAmount - residual;
    const answer = (newBasis / remainingMonths) * 12;
    tableRowsSL[tableRowsSL.length - 1].hasImpairment = true;
    tableRowsSL[tableRowsSL.length - 1].impairmentLoss = impairmentAmount;
    tableRowsSL[tableRowsSL.length - 1].endingBV = bvAtImpairment - impairmentAmount;
    tableRowsSL.push({ beginningBV: bvAtImpairment - impairmentAmount, depreciation: answer, endingBV: bvAtImpairment - impairmentAmount - answer, hasImpairment: false });
    const impairmentTableSL = buildImpairmentDecliningTable(tableRowsSL);
    const impRowSL = tableRowsSL[tableRowsSL.length - 2];

    let acq, acqDateStr;
    if (useFYStart) {
      acq = pastFYStart(e1);
      acqDateStr = dateStr(acq.year, acq.month);
    } else {
      const fyStart = fyMonthToDate(CURRENT_FY - e1, 1);
      const fyStartAbs = fyStart.year * 12 + (fyStart.month - 1);
      const acqAbs = fyStartAbs + (12 - months);
      const acqYear = Math.floor(acqAbs / 12);
      const acqMonth = acqAbs - acqYear * 12 + 1;
      acq = { year: acqYear, month: acqMonth, fy: CURRENT_FY - e1 };
      acqDateStr = useFixedMidYearDate ? dateStr(acqYear, acqMonth) : dateStrAnyDay(acqYear, acqMonth);
    }

    return {
      level: '1', category: '減損損失後の減価償却費',
      question: acqDateStr + '取得の' + item + '(取得原価 ' + yen(originalCost) + '、耐用年数 ' + years + '年、' + residualText(residualRate) + '、定額法により償却)について、前期末に' + yen(impairmentAmount) + 'の減損損失を計上した(耐用年数の見積り及び残存価額に変更はない)。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。',
      answer,
      explain: (residual === 0
          ? '<div class="step">減損前の年間減価償却費 = 取得原価 ÷ 耐用年数</div><div class="step">' + yen(originalCost) + ' ÷ ' + years + ' = ' + yen(annual) + '</div>'
          : '<div class="step">減損前の年間減価償却費 = (取得原価 − 残存価額) ÷ 耐用年数</div><div class="step">(' + yen(originalCost) + ' − ' + yen(residual) + ') ÷ ' + years + ' = ' + yen(annual) + '</div>') +
        '<div class="step">取得日から前期末までの期間をもとに帳簿価額を計算する' + (useFYStart ? '' : '(初年度' + months + 'か月分は月割計算)') + '</div>' +
        impairmentTableSL +
        '<div class="step">減損計上時の帳簿価額 = 期首帳簿価額 − 減価償却費 − 減損損失</div>' + '<div class="step formula">' + yen(impRowSL.beginningBV) + ' − ' + yen(impRowSL.depreciation) + ' − ' + yen(impairmentAmount) + ' = ' + yen(bvAtImpairment - impairmentAmount) + '</div>' +
        (useFYStart
          ? '<div class="step" style="margin-top:16px;">取得日から減損計上時(前期末)までの経過期間 = ' + e1 + '年</div>' + '<div class="step">減損後の残存耐用年数 = ' + years + '年 − ' + e1 + '年 = ' + remainingAtImpairment + '年</div>' + '<div class="step">残存価額は従来と変わらず ' + yen(residual) + '</div>' +
            '<div class="step">当期の減価償却費 = ' + (residual === 0 ? '減損後の帳簿価額' : '(減損後の帳簿価額 − 残存価額)') + ' ÷ 減損後の残存耐用年数</div>' +
            '<div class="step formula">' + (residual === 0 ? yen(bvAtImpairment - impairmentAmount) : '(' + yen(bvAtImpairment - impairmentAmount) + ' − ' + yen(residual) + ')') + ' ÷ ' + remainingAtImpairment + ' = ' + yen(answer) + '</div>'
          : '<div class="step" style="margin-top:16px;">初年度が月割のため、減損後の残存耐用年数も月数で計算する</div>' +
            '<div class="step">耐用年数' + years + '年 = ' + (years * 12) + 'か月</div>' +
            '<div class="step">取得日から減損計上時(前期末)までの経過期間 = ' + elapsedPeriodText(years * 12 - remainingMonths) + '</div>' +
            '<div class="step">減損後の残存耐用年数 = ' + (years * 12) + 'か月 − ' + (years * 12 - remainingMonths) + 'か月 = ' + remainingMonths + 'か月(' + ymText(remainingMonths) + ')</div>' + '<div class="step">残存価額は従来と変わらず ' + yen(residual) + '</div>' +
            '<div class="step">当期の減価償却費 = ' + (residual === 0 ? '減損後の帳簿価額' : '(減損後の帳簿価額 − 残存価額)') + ' ÷ 減損後の残存耐用年数(月数) × 12か月</div>' +
            '<div class="step formula">' + (residual === 0 ? yen(bvAtImpairment - impairmentAmount) : '(' + yen(bvAtImpairment - impairmentAmount) + ' − ' + yen(residual) + ')') + ' ÷ ' + remainingMonths + 'か月 × 12か月 = ' + yen(answer) + '</div>')
    };
  }

  /* ---------- 1級: 減損損失後の減価償却費(定率法) ---------- */
  function genImpairmentDeclining() {
    const item = pickItemFavorBihin();
    const DECL = { 4: 0.5, 5: 0.4, 8: 0.25, 10: 0.2 };
    const years = pick(Object.keys(DECL).map(Number));
    const rate = DECL[years];
    const e1 = pick([1, 2]);
    const residualRate = pickResidualRate();
    const useDeriveRate = Math.random() < 0.5;

    const useFYStart = Math.random() < 0.5;
    let cost, bvAtImpairment, acqDateStr, months, useFixedMidYearDate = false;
    const tableRows = [];
    if (useFYStart) {
      const chain = declineChain(rate, e1);
      cost = chain.cost;
      const acq = pastFYStart(e1);
      acqDateStr = dateStr(acq.year, acq.month);
      let bv = cost;
      for (let y = 1; y <= e1; y++) {
        const newBv = Math.round(bv * (1 - rate));
        tableRows.push({ beginningBV: bv, depreciation: bv - newBv, endingBV: newBv, hasImpairment: false });
        bv = newBv;
      }
      bvAtImpairment = bv;
    } else {
      useFixedMidYearDate = Math.random() < 0.5;
      months = useFixedMidYearDate ? (fixedTrapMonths()) : randInt(1, 11);
      const chain = declineChainProrated(rate, e1, months);
      cost = chain.cost;
      const fyStart = fyMonthToDate(CURRENT_FY - e1, 1);
      const fyStartAbs = fyStart.year * 12 + (fyStart.month - 1);
      const acqAbs = fyStartAbs + (12 - months);
      const acqYear = Math.floor(acqAbs / 12);
      const acqMonth = acqAbs - acqYear * 12 + 1;
      acqDateStr = useFixedMidYearDate ? dateStr(acqYear, acqMonth) : dateStrAnyDay(acqYear, acqMonth);
      const dep1 = Math.round(cost * rate * months / 12);
      const bvAfterFirst = cost - dep1;
      tableRows.push({ beginningBV: cost, depreciation: dep1, endingBV: bvAfterFirst, hasImpairment: false, isProrated: true, months: months });
      let bv = bvAfterFirst;
      for (let y = 0; y < e1 - 1; y++) {
        const newBv = Math.round(bv * (1 - rate));
        tableRows.push({ beginningBV: bv, depreciation: bv - newBv, endingBV: newBv, hasImpairment: false });
        bv = newBv;
      }
      bvAtImpairment = bv;
    }

    const impairmentK = randInt(2, 7);
    const impairmentAmount = Math.round(bvAtImpairment * impairmentK / 10 / 100) * 100;
    const newBasis = bvAtImpairment - impairmentAmount;
    const answer = Math.round(newBasis * rate);

    tableRows[tableRows.length - 1].hasImpairment = true;
    tableRows[tableRows.length - 1].impairmentLoss = impairmentAmount;
    tableRows[tableRows.length - 1].endingBV = newBasis;
    tableRows.push({ beginningBV: newBasis, depreciation: answer, endingBV: newBasis - answer, hasImpairment: false });
    const stepsTable = buildImpairmentDecliningTable(tableRows);
    const impRow = tableRows[tableRows.length - 2];

    return {
      level: '1', category: '減損損失後の減価償却費(定率法)',
      question: acqDateStr + '取得の' + item + '(取得原価 ' + yen(cost) + '、耐用年数 ' + years + '年、' + residualText(residualRate) + ')について、' + (useDeriveRate ? '200%定率法により減価償却している' : '定率法(償却率 ' + rate + ')により減価償却している') + '。前期末に' + yen(impairmentAmount) + 'の減損損失を計上した(耐用年数の見積りに変更はない)。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい(計算の過程で端数が生じる場合は円未満四捨五入)。',
      answer,
      explain: (useDeriveRate ? '<div class="step">200%定率法の償却率 = 1 ÷ 耐用年数' + years + '年 × 200% = ' + rate + '</div>' : '') +
        '<div class="step">定率法では残存価額は使用せず、取得日から前期末までの期間をもとに帳簿価額を計算する' + (useFYStart ? '' : '(初年度' + months + 'か月分は月割計算)') + '</div>' +
        stepsTable +
        '<div class="step">減損計上時の帳簿価額 = 期首帳簿価額 − 減価償却費 − 減損損失</div>' + '<div class="step formula">' + yen(impRow.beginningBV) + ' − ' + yen(impRow.depreciation) + ' − ' + yen(impairmentAmount) + ' = ' + yen(newBasis) + '</div>' +
        '<div class="step" style="margin-top:16px;">減損後も引き続き定率法(償却率' + rate + ')により償却する</div>' +
        '<div class="step">当期の減価償却費 = 減損後の帳簿価額 × 償却率</div>' +
        '<div class="step formula">' + yen(newBasis) + ' × ' + rate + ' = ' + yen(answer) + '</div>'
    };
  }

  /* ---------- 1級: 資産除去債務 ---------- */
  /* ---------- 1級: 圧縮記帳(国庫補助金・直接減額方式) ---------- */
  function genCompressionSubsidy() {
    const item = pick(ITEMS_TANGIBLE);
    const years = yearsForItem(item, YEARS);
    const residualRate = pickResidualRate();
    // 過去年度に取得した問題(約2割):当期は1年分を償却する
    const usePast = Math.random() < 0.2;
    const pastElapsed = usePast ? randInt(1, Math.min(3, years - 1)) : 0;
    const useFYStart = usePast || Math.random() < 0.5;

    const minCompressed = 750000, maxCompressed = item === '建物' ? 1300000000 : 60000000;
    const minDep = residualRate === 0 ? minCompressed : Math.floor(minCompressed * 9 / 10);
    const maxDep = residualRate === 0 ? maxCompressed : Math.floor(maxCompressed * 9 / 10);

    let annual, months, answer, dep, factorUsed, useFixedMidYearDate = false;
    if (useFYStart) {
      const factor = residualRate === 0 ? 1 : 9;
      factorUsed = factor;
      const lo = Math.max(1, Math.ceil(minDep / years / 100 / factor));
      const hi = Math.max(lo, Math.floor(maxDep / years / 100 / factor));
      const annualBase = factor * randInt(lo, hi);
      annual = annualBase * 100;
      dep = annual * years;
      answer = annual;
    } else {
      useFixedMidYearDate = Math.random() < 0.5;
      let multipleNeeded;
      if (useFixedMidYearDate) {
        months = fixedTrapMonths();
        multipleNeeded = 12 / gcd(12, months);
      } else {
        const pf = periodFactor();
        months = pf.months;
        multipleNeeded = pf.multipleNeeded;
      }
      const factor = residualRate === 0 ? multipleNeeded : lcm(multipleNeeded, 9);
      factorUsed = factor;
      const lo = Math.max(1, Math.ceil(minDep / years / 100 / factor));
      const hi = Math.max(lo, Math.floor(maxDep / years / 100 / factor));
      const annualBase = factor * randInt(lo, hi);
      annual = annualBase * 100;
      dep = annual * years;
      answer = Math.round(annual * months / 12);
    }
    const { cost: compressedCost, residual } = buildCostFromDep(dep, residualRate);

    const subsidyRatio = randInt(10, 40) / 100;
    const subsidy = Math.max(1000, Math.round(compressedCost * subsidyRatio / (1 - subsidyRatio) / 1000) * 1000);
    const originalCost = compressedCost + subsidy;

    let acqDateStr;
    if (usePast) {
      const pa = pastDate(pastElapsed);
      acqDateStr = Math.random() < 0.5 ? dateStr(pa.year, pa.month) : dateStrAnyDay(pa.year, pa.month);
    } else if (useFYStart) {
      acqDateStr = fyStartDateStr(CURRENT_FY);
    } else {
      const fyMonth = 13 - months;
      const d = fyMonthToDate(CURRENT_FY, fyMonth);
      acqDateStr = useFixedMidYearDate ? dateStr(d.year, d.month) : dateStrAnyDay(d.year, d.month);
    }

    const residualLabel = residualRate === 0 ? '残存価額はゼロ' : '残存価額は圧縮記帳後の取得原価の10%';
    const subsidyLabel = item === '構築物' && Math.random() < 0.5 ? '工事負担金' : '国庫補助金';

    const depLabel = residual === 0 ? '圧縮記帳後の取得原価 ÷ 耐用年数' : '(圧縮記帳後の取得原価 − 残存価額) ÷ 耐用年数';
    const depCalc = residual === 0 ? yen(compressedCost) + ' ÷ ' + years : '(' + yen(compressedCost) + ' − ' + yen(residual) + ') ÷ ' + years;
    const proRateSteps = useFYStart
      ? (usePast
          ? '<div class="step">取得日(' + acqDateStr + ')は前期以前のため、当期は1年分の減価償却費を計上する</div>'
          : '<div class="step">当期首(' + acqDateStr + ')に取得しているため、当期は1年分の減価償却費を計上する</div>') +
        '<div class="step">当期の減価償却費 = ' + depLabel + '</div>' +
        '<div class="step formula">' + depCalc + ' = ' + yen(answer) + '</div>'
      : '<div class="step">取得日から当期末までの使用月数は' + months + 'か月なので月割計算する</div>' +
        '<div class="step">年間の減価償却費 = ' + depLabel + '</div>' +
        '<div class="step">' + depCalc + ' = ' + yen(annual) + '</div>' +
        '<div class="step formula">当期分 = ' + yen(annual) + ' × ' + months + ' ÷ 12 = ' + yen(answer) + '</div>';

    return {
      level: '2', category: '圧縮記帳(国庫補助金・直接減額方式)',
      question: acqDateStr + 'に' + item + '(取得原価 ' + yen(originalCost) + ')を取得した。この' + item + 'の取得にあたり、' + subsidyLabel + '' + yen(subsidy) + 'を受け入れている。直接減額方式により圧縮記帳を行い、' + residualLabel + '、耐用年数 ' + years + '年の定額法により減価償却する場合、当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。',
      answer,
      explain: '<div class="step">直接減額方式では、' + subsidyLabel + 'の額だけ取得原価を直接減額(圧縮記帳)する</div>' +
        '<div class="step">圧縮記帳額 = ' + subsidyLabel + 'の額 = ' + yen(subsidy) + '</div>' +
        '<div class="step">圧縮記帳後の取得原価 = 取得原価 − 圧縮記帳額</div>' + '<div class="step formula">' + yen(originalCost) + ' − ' + yen(subsidy) + ' = ' + yen(compressedCost) + '</div>' +
        '<div class="step" style="margin-top:16px;">以後の減価償却は、圧縮記帳後の取得原価をもとに計算する</div>' +
        proRateSteps
    };
  }

  function genCompressionSubsidyDeclining() {
    const item = pickItemFavorBihin();
    const DECL = { 4: 0.5, 5: 0.4, 8: 0.25, 10: 0.2 };
    const rateFrac = { 0.5: [1, 2], 0.4: [2, 5], 0.25: [1, 4], 0.2: [1, 5] };
    const oneMinusFrac = { 0.5: [1, 2], 0.4: [3, 5], 0.25: [3, 4], 0.2: [4, 5] };
    const years = pick(Object.keys(DECL).map(Number));
    const rate = DECL[years];
    const [rNumer, rDenom] = rateFrac[rate];
    const residualRate = pickResidualRate();
    const elapsed = randInt(0, 2);
    const useFYStart = Math.random() < 0.5;

    let compressedCost, answer, months, bookValueAfterE, acqDateStr, elapsedSteps = '', subsidyUnitD, useFixedMidYearDate = false;
    const minCompressedD = 750000, maxCompressedD = 60000000;

    if (elapsed === 0) {
      if (useFYStart) {
        const lo = Math.max(1, Math.ceil(minCompressedD / rDenom / 100));
        const hi = Math.max(lo, Math.floor(maxCompressedD / rDenom / 100));
        const costBase = rDenom * randInt(lo, hi);
        compressedCost = costBase * 100;
        answer = compressedCost * rNumer / rDenom;
        acqDateStr = fyStartDateStr(CURRENT_FY);
        subsidyUnitD = rDenom * 100;
      } else {
        useFixedMidYearDate = Math.random() < 0.5;
        if (useFixedMidYearDate) {
          months = fixedTrapMonths();
        } else {
          months = periodFactor().months;
        }
        const g = gcd(months, rDenom * 12);
        const D = (rDenom * 12) / g;
        const loK = Math.max(1, Math.ceil(minCompressedD / D / 100));
        const hiK = Math.max(loK, Math.floor(maxCompressedD / D / 100));
        const k = randInt(loK, hiK);
        compressedCost = D * k * 100;
        answer = compressedCost * rNumer * months / (rDenom * 12);
        const fyMonth = 13 - months;
        const d = fyMonthToDate(CURRENT_FY, fyMonth);
        acqDateStr = useFixedMidYearDate ? dateStr(d.year, d.month) : dateStrAnyDay(d.year, d.month);
        subsidyUnitD = D * 100;
      }
    } else {
      const [oNumer, oDenom] = oneMinusFrac[rate];
      if (useFYStart) {
        const unit = Math.pow(oDenom, elapsed) * 100;
        const lo = Math.max(1, Math.ceil(minCompressedD / unit));
        const hi = Math.max(lo, Math.floor(maxCompressedD / unit));
        const m = randInt(lo, hi);
        compressedCost = unit * m;
        bookValueAfterE = Math.pow(oNumer, elapsed) * m * 100;
        answer = bookValueAfterE * rNumer / rDenom;
        const acq = pastFYStart(elapsed);
        acqDateStr = dateStr(acq.year, acq.month);
        const tableRowsCSD = [];
        let bv = compressedCost;
        for (let y = 1; y <= elapsed + 1; y++) {
          const newBv = Math.round(bv * (1 - rate));
          tableRowsCSD.push({ beginningBV: bv, depreciation: bv - newBv, endingBV: newBv });
          bv = newBv;
        }
        elapsedSteps = '<div class="step">200%定率法の償却率 = 1 ÷ 耐用年数' + years + '年 × 200% = ' + rate + '</div>' + buildYearTableSimple(tableRowsCSD);
        subsidyUnitD = unit;
      } else {
        useFixedMidYearDate = Math.random() < 0.5;
        if (useFixedMidYearDate) {
          months = fixedTrapMonths();
        } else {
          months = periodFactor().months;
        }
        const fullYearsAfterFirst = elapsed - 1;
        const P1_denom = rDenom * 12;
        const D = P1_denom * Math.pow(oDenom, fullYearsAfterFirst) * rDenom;
        const lo = Math.max(1, Math.ceil(minCompressedD / D / 100));
        const hi = Math.max(lo, Math.floor(maxCompressedD / D / 100));
        const k = randInt(lo, hi);
        compressedCost = D * k * 100;
        const dep1 = compressedCost * rNumer * months / P1_denom;
        let bv = compressedCost - dep1;
        const tableRowsCSD2 = [{ beginningBV: compressedCost, depreciation: dep1, endingBV: bv, months: months }];
        for (let y = 0; y < fullYearsAfterFirst; y++) {
          const nb = Math.round(bv * (1 - rate));
          tableRowsCSD2.push({ beginningBV: bv, depreciation: bv - nb, endingBV: nb });
          bv = nb;
        }
        bookValueAfterE = bv;
        answer = bv * rNumer / rDenom;
        tableRowsCSD2.push({ beginningBV: bookValueAfterE, depreciation: answer, endingBV: bookValueAfterE - answer });
        elapsedSteps = '<div class="step">200%定率法の償却率 = 1 ÷ 耐用年数' + years + '年 × 200% = ' + rate + '</div>' + buildYearTableSimple(tableRowsCSD2);
        const fyStart = fyMonthToDate(CURRENT_FY, 1);
        const fyStartAbs = fyStart.year * 12 + (fyStart.month - 1);
        const acqAbs = fyStartAbs - ((elapsed - 1) * 12 + months);
        const acqYear = Math.floor(acqAbs / 12);
        const acqMonth = acqAbs - acqYear * 12 + 1;
        acqDateStr = useFixedMidYearDate ? dateStr(acqYear, acqMonth) : dateStrAnyDay(acqYear, acqMonth);
        subsidyUnitD = D * 100;
      }
    }

    const subsidyRatio = randInt(10, 40) / 100;
    const subsidy = Math.max(1000, Math.round(compressedCost * subsidyRatio / (1 - subsidyRatio) / 1000) * 1000);
    const originalCost = compressedCost + subsidy;

    const proRateSteps = elapsed === 0
      ? (useFYStart
        ? '<div class="step">200%定率法の償却率 = 1 ÷ 耐用年数' + years + '年 × 200% = ' + rate + '</div>' + '<div class="step">当期の減価償却費 = 圧縮記帳後の取得原価 × 償却率</div>' + '<div class="step formula">' + yen(compressedCost) + ' × ' + rate + ' = ' + yen(answer) + '</div>'
        : '<div class="step">取得日から当期末までの使用月数は' + months + 'か月なので月割計算する</div>' +
          '<div class="step">200%定率法の償却率 = 1 ÷ 耐用年数' + years + '年 × 200% = ' + rate + '</div>' +
          '<div class="step">当期の減価償却費 = 圧縮記帳後の取得原価 × 償却率 × 使用月数 ÷ 12</div>' + '<div class="step formula">' + yen(compressedCost) + ' × ' + rate + ' × ' + months + ' ÷ 12 = ' + yen(answer) + '</div>')
      : ('<div class="step">取得日から当期首までの期間をもとに期首帳簿価額を計算する' + (useFYStart ? '' : '(初年度' + months + 'か月分は月割計算)') + '</div>' +
        elapsedSteps +
        '<div class="step">当期の減価償却費 = 期首帳簿価額 × 償却率</div>' + '<div class="step formula">' + yen(bookValueAfterE) + ' × ' + rate + ' = ' + yen(answer) + '</div>');

    return {
      level: '2', category: '圧縮記帳(国庫補助金・直接減額方式・定率法)',
      question: acqDateStr + 'に' + item + '(取得原価 ' + yen(originalCost) + ')を取得した。この' + item + 'の取得にあたり、国庫補助金' + yen(subsidy) + 'を受け入れている。直接減額方式により圧縮記帳を行い、' + residualText(residualRate) + '、耐用年数 ' + years + '年、200%定率法により減価償却する場合、当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。',
      answer,
      explain: '<div class="step">直接減額方式では、国庫補助金の額だけ取得原価を直接減額(圧縮記帳)する</div>' +
        '<div class="step">圧縮記帳額 = 国庫補助金の額 = ' + yen(subsidy) + '</div>' +
        '<div class="step">圧縮記帳後の取得原価 = 取得原価 − 圧縮記帳額</div>' + '<div class="step formula">' + yen(originalCost) + ' − ' + yen(subsidy) + ' = ' + yen(compressedCost) + '</div>' +
        '<div class="step" style="margin-top:16px;">定率法では残存価額は計算に使用しない。以後の減価償却は、圧縮記帳後の取得原価をもとに計算する</div>' +
        proRateSteps
    };
  }

  /* ---------- 1級: 圧縮記帳(国庫補助金・積立金方式) ---------- */
  function genCompressionReserveMethod() {
    const item = pick(ITEMS_TANGIBLE);
    const years = yearsForItem(item, YEARS);
    const residualRate = pickResidualRate();
    const useFYStart = Math.random() < 0.5;

    let annual, months, answer, dep, factorUsedR, useFixedMidYearDate = false;
    const minDepR = residualRate === 0 ? 1000000 : Math.floor(1000000 * 9 / 10);
    const maxCostR = item === '建物' ? 2000000000 : 99000000;
    const maxDepR = residualRate === 0 ? maxCostR : Math.floor(maxCostR * 9 / 10);
    if (useFYStart) {
      const factor = residualRate === 0 ? 1 : 9;
      factorUsedR = factor;
      const lo = Math.max(1, Math.ceil(minDepR / years / 100 / factor));
      const hi = Math.max(lo, Math.floor(maxDepR / years / 100 / factor));
      const annualBase = factor * randInt(lo, hi);
      annual = annualBase * 100;
      dep = annual * years;
      answer = annual;
    } else {
      useFixedMidYearDate = Math.random() < 0.5;
      let multipleNeeded;
      if (useFixedMidYearDate) {
        months = fixedTrapMonths();
        multipleNeeded = 12 / gcd(12, months);
      } else {
        const pf = periodFactor();
        months = pf.months;
        multipleNeeded = pf.multipleNeeded;
      }
      const factor = residualRate === 0 ? multipleNeeded : lcm(multipleNeeded, 9);
      factorUsedR = factor;
      const lo = Math.max(1, Math.ceil(minDepR / years / 100 / factor));
      const hi = Math.max(lo, Math.floor(maxDepR / years / 100 / factor));
      const annualBase = factor * randInt(lo, hi);
      annual = annualBase * 100;
      dep = annual * years;
      answer = Math.round(annual * months / 12);
    }
    const { cost: originalCost, residual } = buildCostFromDep(dep, residualRate);

    const subsidyUnitR = residualRate === 0 ? factorUsedR * years * 100 : (factorUsedR / 9) * 10 * years * 100;
    const subsidyBaseR = randInt(1, Math.max(2, Math.round(originalCost / subsidyUnitR / 2)));
    const subsidy = subsidyUnitR * subsidyBaseR;

    let acqDateStr;
    if (useFYStart) {
      acqDateStr = fyStartDateStr(CURRENT_FY);
    } else {
      const fyMonth = 13 - months;
      const d = fyMonthToDate(CURRENT_FY, fyMonth);
      acqDateStr = useFixedMidYearDate ? dateStr(d.year, d.month) : dateStrAnyDay(d.year, d.month);
    }

    const proRateSteps = useFYStart
      ? '<div class="step">当期首(' + acqDateStr + ')に取得しているため、当期は1年分の減価償却費を計上する</div>' +
        '<div class="step">当期の減価償却費 = ' + (residual === 0 ? '取得原価 ÷ 耐用年数' : '(取得原価 − 残存価額) ÷ 耐用年数') + '</div>' +
        '<div class="step formula">' + (residual === 0 ? yen(originalCost) : '(' + yen(originalCost) + ' − ' + yen(residual) + ')') + ' ÷ ' + years + ' = ' + yen(answer) + '</div>'
      : '<div class="step">取得日から当期末までの使用月数は' + months + 'か月なので月割計算する</div>' +
        '<div class="step">年間の減価償却費 = ' + (residual === 0 ? '取得原価 ÷ 耐用年数' : '(取得原価 − 残存価額) ÷ 耐用年数') + '</div>' +
        '<div class="step">' + (residual === 0 ? yen(originalCost) : '(' + yen(originalCost) + ' − ' + yen(residual) + ')') + ' ÷ ' + years + ' = ' + yen(annual) + '</div>' +
        '<div class="step formula">当期分 = ' + yen(annual) + ' × ' + months + ' ÷ 12 = ' + yen(answer) + '</div>';

    const subsidyLabel2 = item === '構築物' && Math.random() < 0.5 ? '工事負担金' : '国庫補助金';

    return {
      level: '1', category: '圧縮記帳(国庫補助金・積立金方式)',
      question: acqDateStr + 'に' + item + '(取得原価 ' + yen(originalCost) + ')を取得した。この' + item + 'の取得にあたり、' + subsidyLabel2 + '' + yen(subsidy) + 'を受け入れている。積立金方式により圧縮記帳を行い、' + residualText(residualRate) + '、耐用年数 ' + years + '年の定額法により減価償却する場合、当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。',
      answer,
      explain: '<div class="step">積立金方式では、資産の帳簿価額を直接減額せず、取得原価をそのまま計上する</div>' +
        '<div class="step">減価償却は圧縮前の取得原価をもとに計算する(' + subsidyLabel2 + 'の額は差し引かない)</div>' +
        proRateSteps +
        '<div class="step" style="margin-top:16px;">(参考)決算にあたり、圧縮限度額' + yen(subsidy) + 'を圧縮積立金として積み立て、その後は耐用年数にわたって取り崩していく</div>'
    };
  }

  function genCompressionReserveMethodDeclining() {
    const item = pickItemFavorBihin();
    const DECL = { 4: 0.5, 5: 0.4, 8: 0.25, 10: 0.2 };
    const rateFrac = { 0.5: [1, 2], 0.4: [2, 5], 0.25: [1, 4], 0.2: [1, 5] };
    const oneMinusFrac = { 0.5: [1, 2], 0.4: [3, 5], 0.25: [3, 4], 0.2: [4, 5] };
    const years = pick(Object.keys(DECL).map(Number));
    const rate = DECL[years];
    const [rNumer, rDenom] = rateFrac[rate];
    const residualRate = pickResidualRate();
    const elapsed = randInt(0, 2);
    const useFYStart = Math.random() < 0.5;

    let originalCost, answer, months, bookValueAfterE, acqDateStr, elapsedSteps = '', subsidyUnitRD, useFixedMidYearDate = false;
    const minCostRD = 1000000, maxCostRD = 99000000;

    if (elapsed === 0) {
      if (useFYStart) {
        const lo = Math.max(1, Math.ceil(minCostRD / rDenom / 100));
        const hi = Math.max(lo, Math.floor(maxCostRD / rDenom / 100));
        const costBase = rDenom * randInt(lo, hi);
        originalCost = costBase * 100;
        answer = originalCost * rNumer / rDenom;
        acqDateStr = fyStartDateStr(CURRENT_FY);
        subsidyUnitRD = rDenom * 100;
      } else {
        useFixedMidYearDate = Math.random() < 0.5;
        if (useFixedMidYearDate) {
          months = fixedTrapMonths();
        } else {
          months = periodFactor().months;
        }
        const g = gcd(months, rDenom * 12);
        const D = (rDenom * 12) / g;
        const loK = Math.max(1, Math.ceil(minCostRD / D / 100));
        const hiK = Math.max(loK, Math.floor(maxCostRD / D / 100));
        const k = randInt(loK, hiK);
        originalCost = D * k * 100;
        answer = originalCost * rNumer * months / (rDenom * 12);
        const fyMonth = 13 - months;
        const d = fyMonthToDate(CURRENT_FY, fyMonth);
        acqDateStr = useFixedMidYearDate ? dateStr(d.year, d.month) : dateStrAnyDay(d.year, d.month);
        subsidyUnitRD = D * 100;
      }
    } else {
      const [oNumer, oDenom] = oneMinusFrac[rate];
      if (useFYStart) {
        const unit = Math.pow(oDenom, elapsed) * 100;
        const lo = Math.max(1, Math.ceil(minCostRD / unit));
        const hi = Math.max(lo, Math.floor(maxCostRD / unit));
        const m = randInt(lo, hi);
        originalCost = unit * m;
        bookValueAfterE = Math.pow(oNumer, elapsed) * m * 100;
        answer = bookValueAfterE * rNumer / rDenom;
        const acq = pastFYStart(elapsed);
        acqDateStr = dateStr(acq.year, acq.month);
        const tableRowsCRD = [];
        let bv = originalCost;
        for (let y = 1; y <= elapsed + 1; y++) {
          const newBv = Math.round(bv * (1 - rate));
          tableRowsCRD.push({ beginningBV: bv, depreciation: bv - newBv, endingBV: newBv });
          bv = newBv;
        }
        elapsedSteps = buildYearTableSimple(tableRowsCRD);
        subsidyUnitRD = unit;
      } else {
        useFixedMidYearDate = Math.random() < 0.5;
        if (useFixedMidYearDate) {
          months = fixedTrapMonths();
        } else {
          months = periodFactor().months;
        }
        const fullYearsAfterFirst = elapsed - 1;
        const P1_denom = rDenom * 12;
        const D = P1_denom * Math.pow(oDenom, fullYearsAfterFirst) * rDenom;
        const lo = Math.max(1, Math.ceil(minCostRD / D / 100));
        const hi = Math.max(lo, Math.floor(maxCostRD / D / 100));
        const k = randInt(lo, hi);
        originalCost = D * k * 100;
        const dep1 = originalCost * rNumer * months / P1_denom;
        let bv = originalCost - dep1;
        const tableRowsCRD2 = [{ beginningBV: originalCost, depreciation: dep1, endingBV: bv, months: months }];
        for (let y = 0; y < fullYearsAfterFirst; y++) {
          const nb = Math.round(bv * (1 - rate));
          tableRowsCRD2.push({ beginningBV: bv, depreciation: bv - nb, endingBV: nb });
          bv = nb;
        }
        bookValueAfterE = bv;
        answer = bv * rNumer / rDenom;
        tableRowsCRD2.push({ beginningBV: bookValueAfterE, depreciation: answer, endingBV: bookValueAfterE - answer });
        elapsedSteps = buildYearTableSimple(tableRowsCRD2);
        const fyStart = fyMonthToDate(CURRENT_FY, 1);
        const fyStartAbs = fyStart.year * 12 + (fyStart.month - 1);
        const acqAbs = fyStartAbs - ((elapsed - 1) * 12 + months);
        const acqYear = Math.floor(acqAbs / 12);
        const acqMonth = acqAbs - acqYear * 12 + 1;
        acqDateStr = useFixedMidYearDate ? dateStr(acqYear, acqMonth) : dateStrAnyDay(acqYear, acqMonth);
        subsidyUnitRD = D * 100;
      }
    }

    const subsidyBase = randInt(1, Math.max(2, Math.round(originalCost / subsidyUnitRD / 2)));
    const subsidy = subsidyUnitRD * subsidyBase;

    const proRateSteps = elapsed === 0
      ? (useFYStart
        ? '<div class="step">当期の減価償却費 = 取得原価 × 償却率</div>' + '<div class="step formula">' + yen(originalCost) + ' × ' + rate + ' = ' + yen(answer) + '</div>'
        : '<div class="step">取得日から当期末までの使用月数は' + months + 'か月なので月割計算する</div>' +
          '<div class="step">当期の減価償却費 = 取得原価 × 償却率 × 使用月数 ÷ 12</div>' + '<div class="step formula">' + yen(originalCost) + ' × ' + rate + ' × ' + months + ' ÷ 12 = ' + yen(answer) + '</div>')
      : ('<div class="step">定率法では残存価額は使用せず、取得日から当期首までの期間をもとに期首帳簿価額を計算する' + (useFYStart ? '' : '(初年度' + months + 'か月分は月割計算)') + '</div>' +
        elapsedSteps +
        '<div class="step">当期の減価償却費 = 期首帳簿価額 × 償却率</div>' + '<div class="step formula">' + yen(bookValueAfterE) + ' × ' + rate + ' = ' + yen(answer) + '</div>');

    return {
      level: '1', category: '圧縮記帳(国庫補助金・積立金方式・定率法)',
      question: acqDateStr + 'に' + item + '(取得原価 ' + yen(originalCost) + ')を取得した。この' + item + 'の取得にあたり、国庫補助金' + yen(subsidy) + 'を受け入れている。積立金方式により圧縮記帳を行い、' + residualText(residualRate) + '、耐用年数 ' + years + '年、200%定率法により減価償却する場合、当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。',
      answer,
      explain: '<div class="step">積立金方式では、資産の帳簿価額を直接減額せず、取得原価をそのまま計上する</div>' +
        '<div class="step">減価償却は圧縮前の取得原価をもとに計算する(国庫補助金の額は差し引かない)</div>' +
        (elapsed === 0 ? '<div class="step">定率法では残存価額は計算に使用しない</div>' : '') +
        '<div class="step">200%定率法の償却率 = 1 ÷ 耐用年数' + years + '年 × 200% = ' + rate + '</div>' +
        proRateSteps +
        '<div class="step" style="margin-top:16px;">(参考)決算にあたり、圧縮限度額' + yen(subsidy) + 'を圧縮積立金として積み立て、その後は耐用年数にわたって取り崩していく</div>'
    };
  }

  /* ---------- 1級: 自家建設 ---------- */
  function genCompressionInsurance() {
    const item = pickItemFavorBihin();
    const DECL = { 4: 0.5, 5: 0.4, 8: 0.25, 10: 0.2 };
    const rateFrac = { 0.5: [1, 2], 0.4: [2, 5], 0.25: [1, 4], 0.2: [1, 5] };
    const YEARS_STRAIGHT_INS = [3, 4, 5, 6, 8, 10, 15, 20];
    const useStraightLine = Math.random() < 0.5;
    const residualRate = pickResidualRate();
    const useDirectMethod = Math.random() < 0.5;
    const hasRemovalCost = Math.random() < 0.5;

    let years, rate, compressedCost, annual, newCost, residual, insuranceGain;
    const minDirect = 750000, maxDirect = 60000000;
    const minReserve = 1000000, maxReserve = 99000000;

    if (useStraightLine) {
      years = pick(YEARS_STRAIGHT_INS);
      const factor = residualRate === 0 ? 1 : 9;
      const gainUnit = residualRate === 0 ? years * 100 : (10 * years / gcd(9, years)) * 100;
      if (useDirectMethod) {
        const minDep = residualRate === 0 ? minDirect : Math.floor(minDirect * 9 / 10);
        const maxDep = residualRate === 0 ? maxDirect : Math.floor(maxDirect * 9 / 10);
        const lo = Math.max(1, Math.ceil(minDep / years / 100 / factor));
        const hi = Math.max(lo, Math.floor(maxDep / years / 100 / factor));
        const annualBase = factor * randInt(lo, hi);
        annual = annualBase * 100;
        const dep = annual * years;
        const c = buildCostFromDep(dep, residualRate);
        compressedCost = c.cost;
        residual = c.residual;
        const gainBase = randInt(1, Math.max(2, Math.round(compressedCost / gainUnit / 2)));
        insuranceGain = gainUnit * gainBase;
        newCost = compressedCost + insuranceGain;
      } else {
        const minDep = residualRate === 0 ? minReserve : Math.floor(minReserve * 9 / 10);
        const maxDep = residualRate === 0 ? maxReserve : Math.floor(maxReserve * 9 / 10);
        const lo = Math.max(1, Math.ceil(minDep / years / 100 / factor));
        const hi = Math.max(lo, Math.floor(maxDep / years / 100 / factor));
        const annualBase = factor * randInt(lo, hi);
        annual = annualBase * 100;
        const dep = annual * years;
        const c = buildCostFromDep(dep, residualRate);
        newCost = c.cost;
        residual = c.residual;
        compressedCost = null;
        const gainBase = randInt(1, Math.max(2, Math.round(newCost / gainUnit / 3)));
        insuranceGain = gainUnit * gainBase;
      }
    } else {
      years = pick(Object.keys(DECL).map(Number));
      rate = DECL[years];
      const [rNumer, rDenom] = rateFrac[rate];
      const gainUnitD = rDenom * 100;
      if (useDirectMethod) {
        const lo = Math.max(1, Math.ceil(minDirect / rDenom / 100));
        const hi = Math.max(lo, Math.floor(maxDirect / rDenom / 100));
        const m = randInt(lo, hi);
        compressedCost = rDenom * m * 100;
        annual = compressedCost * rNumer / rDenom;
        const gainBase = randInt(1, Math.max(2, Math.round(compressedCost / gainUnitD / 2)));
        insuranceGain = gainUnitD * gainBase;
        newCost = compressedCost + insuranceGain;
      } else {
        const lo = Math.max(1, Math.ceil(minReserve / rDenom / 100));
        const hi = Math.max(lo, Math.floor(maxReserve / rDenom / 100));
        const m = randInt(lo, hi);
        newCost = rDenom * m * 100;
        annual = newCost * rNumer / rDenom;
        compressedCost = null;
        const gainBase = randInt(1, Math.max(2, Math.round(newCost / gainUnitD / 3)));
        insuranceGain = gainUnitD * gainBase;
      }
    }

    const oldBookValueBase = randInt(1000, Math.max(2000, Math.floor(newCost / 100 / 3)));
    const oldBookValue = oldBookValueBase * 100;
    const removalCost = hasRemovalCost ? randInt(100, 50000) * 100 : 0;
    const insuranceReceived = oldBookValue + removalCost + insuranceGain;
    const targetOldCostRatio = 0.5 + Math.random() * 1.3;
    const targetOldCost = Math.round(newCost * targetOldCostRatio / 100) * 100;
    const oldAccDep = Math.max(10000, targetOldCost - oldBookValue);
    const oldCost = oldBookValue + oldAccDep;

    const acqDateStr = fyStartDateStr(CURRENT_FY);
    const fyStart = fyMonthToDate(CURRENT_FY, 1);
    const newAssetDay = randInt(2, 28);
    const newAssetDateStr = 'X' + fyStart.year + '年' + fyStart.month + '月' + newAssetDay + '日';

    const methodClause = useStraightLine ? '耐用年数 ' + years + '年の定額法' : '耐用年数 ' + years + '年の200%定率法';
    const residualLabel2 = residualRate === 0 ? '残存価額はゼロ' : (useDirectMethod ? '残存価額は圧縮記帳後の取得原価の10%' : '残存価額は取得原価の10%');
    const removalClause = hasRemovalCost ? 'し、火災に伴う撤去費用' + yen(removalCost) + 'を現金で支払った' : 'した';

    const rateStep = useStraightLine ? '' : '<div class="step">200%定率法の償却率 = 1 ÷ 耐用年数' + years + '年 × 200% = ' + rate + '</div>';

    const newAssetNote = newAssetDateStr === fyStartDateStr(CURRENT_FY)
      ? '<div class="step">当期首(' + newAssetDateStr + ')に取得しているため、当期は1年分の減価償却費を計上する</div>'
      : '<div class="step">新資産の取得日(' + newAssetDateStr + ')から当期末までの使用月数は12か月(取得した月を含む)のため、当期は1年分の減価償却費を計上する</div>';
    let depSteps;
    if (useDirectMethod) {
      depSteps = useStraightLine
        ? '<div class="step">当期の減価償却費 = ' + (residual === 0 ? '圧縮記帳後の取得原価 ÷ 耐用年数' : '(圧縮記帳後の取得原価 − 残存価額) ÷ 耐用年数') + '</div>' +
          '<div class="step formula">' + (residual === 0 ? yen(compressedCost) : '(' + yen(compressedCost) + ' − ' + yen(residual) + ')') + ' ÷ ' + years + ' = ' + yen(annual) + '</div>'
        : '<div class="step">当期の減価償却費 = 圧縮記帳後の取得原価 × 償却率</div>' + '<div class="step formula">' + yen(compressedCost) + ' × ' + rate + ' = ' + yen(annual) + '</div>';
    } else {
      depSteps = useStraightLine
        ? '<div class="step">当期の減価償却費 = ' + (residual === 0 ? '取得原価 ÷ 耐用年数' : '(取得原価 − 残存価額) ÷ 耐用年数') + '</div>' +
          '<div class="step formula">' + (residual === 0 ? yen(newCost) : '(' + yen(newCost) + ' − ' + yen(residual) + ')') + ' ÷ ' + years + ' = ' + yen(annual) + '</div>'
        : '<div class="step">当期の減価償却費 = 取得原価 × 償却率</div>' + '<div class="step formula">' + yen(newCost) + ' × ' + rate + ' = ' + yen(annual) + '</div>';
    }
    depSteps = newAssetNote + depSteps;

    const methodExplain = useDirectMethod
      ? '<div class="step">直接減額方式では、保険差益の額だけ新資産の取得原価を直接減額(圧縮記帳)する</div>' +
        '<div class="step">圧縮記帳後の取得原価 = 新資産の取得原価 − 保険差益</div>' + '<div class="step formula">' + yen(newCost) + ' − ' + yen(insuranceGain) + ' = ' + yen(compressedCost) + '</div>' +
        '<div class="step" style="margin-top:16px;">以後の減価償却は、圧縮記帳後の取得原価をもとに計算する</div>'
      : '<div class="step">積立金方式では、新資産の帳簿価額を直接減額せず、取得原価をそのまま計上する</div>' +
        '<div class="step">減価償却は圧縮前の取得原価をもとに計算する(保険差益の額は差し引かない)</div>';

    return {
      level: '1', category: '圧縮記帳(保険差益・' + (useDirectMethod ? '直接減額方式' : '積立金方式') + ')',
      question: acqDateStr + 'に火災により' + item + '(取得原価 ' + yen(oldCost) + '、減価償却累計額 ' + yen(oldAccDep) + ')が焼失' + removalClause + '。後日、保険会社より保険金' + yen(insuranceReceived) + 'を受け取り、' + newAssetDateStr + 'に新たに同種の' + item + '(取得原価 ' + yen(newCost) + ')を取得した。' + (useDirectMethod ? '直接減額方式' : '積立金方式') + 'により圧縮記帳を行い、' + residualLabel2 + '、' + methodClause + 'により減価償却する場合、当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。',
      answer: annual,
      explain: '<div class="step">焼失した' + item + 'の帳簿価額 = 取得原価 − 減価償却累計額</div>' + '<div class="step">' + yen(oldCost) + ' − ' + yen(oldAccDep) + ' = ' + yen(oldBookValue) + '</div>' +
        (hasRemovalCost
          ? '<div class="step">差引保険金 = 受け取った保険金 − 撤去費用</div>' + '<div class="step">' + yen(insuranceReceived) + ' − ' + yen(removalCost) + ' = ' + yen(insuranceReceived - removalCost) + '</div>' +
            '<div class="step">保険差益 = 差引保険金 − 焼失資産の帳簿価額</div>' + '<div class="step formula">' + yen(insuranceReceived - removalCost) + ' − ' + yen(oldBookValue) + ' = ' + yen(insuranceGain) + '</div>'
          : '<div class="step">保険差益 = 受け取った保険金 − 焼失資産の帳簿価額</div>' + '<div class="step formula">' + yen(insuranceReceived) + ' − ' + yen(oldBookValue) + ' = ' + yen(insuranceGain) + '</div>') +
        '<div class="step" style="margin-top:16px;">保険差益をもとに、新資産について圧縮記帳を行うことができる</div>' +
        methodExplain +
        rateStep +
        depSteps
    };
  }

  function genSelfConstruction() {
    const acqPeriodSC = determineAcqPeriod(0.5, 0);
    const useFYStart = acqPeriodSC.useFYStart;
    const hasLoan = !useFYStart && Math.random() < 0.7;
    const capitalizeInterest = hasLoan ? Math.random() < 0.5 : false;
    const item = '建物';
    const years = pick([20, 22, 24, 30, 34, 38, 50]);
    const residualRate = pickResidualRate();

    let annual, months, answer, dep;
    const targetCostLow = 1000000, targetCostHigh = 2000000000;
    if (useFYStart) {
      const divisor = 100 * years;
      let annualBase;
      if (residualRate === 0) {
        const low = Math.max(1, Math.ceil(targetCostLow / divisor));
        const high = Math.max(low + 1, Math.floor(targetCostHigh / divisor));
        annualBase = randInt(low, high);
      } else {
        const effDivisor = divisor * 10 / 9;
        const low9 = Math.max(1, Math.ceil(targetCostLow / effDivisor / 9));
        const high9 = Math.max(low9 + 1, Math.floor(targetCostHigh / effDivisor / 9));
        annualBase = 9 * randInt(low9, high9);
      }
      annual = annualBase * 100;
      dep = annual * years;
      answer = annual;
    } else {
      months = acqPeriodSC.months;
      const factor = residualRate === 0 ? acqPeriodSC.multipleNeeded : lcm(acqPeriodSC.multipleNeeded, 9);
      const divisor = 100 * years * factor;
      const low = Math.max(1, Math.ceil(targetCostLow / divisor));
      const high = Math.max(low + 1, Math.floor(targetCostHigh / divisor));
      const scaleMultiplier = randInt(low, high);
      const annualBase = factor * scaleMultiplier;
      annual = annualBase * 100;
      dep = annual * years;
      answer = Math.round(annual * months / 12);
    }
    const { cost: totalCost, residual } = buildCostFromDep(dep, residualRate);
    const estimatedCurrentPeriodCosts = totalCost * 0.325;

    const monthsSinceFYStart = hasLoan ? (12 - months) : 0;

    let interest = 0, loanAmount = 0, interestRatePercent = 0, paymentMonth = 0;
    if (hasLoan) {
      const numerator = residualRate === 0 ? months : 9 * months;
      const denominator = residualRate === 0 ? (years * 12) : (10 * years * 12);
      const D = denominator / gcd(numerator, denominator);
      const rateCandidates = [1, 2, 4, 5, 10];
      let best = null;
      rateCandidates.forEach(function (rateCandidate) {
        const rm = rateCandidate * monthsSinceFYStart;
        const g1 = gcd(rm, 1200);
        const need1 = 1200 / g1;
        const partial = 100 * (rm / g1);
        const g2 = gcd(partial, D);
        const extraFactor = D / g2;
        const unitBase = need1 * extraFactor;
        if (!best || unitBase < best.unitBase) best = { rateCandidate: rateCandidate, unitBase: unitBase, rm: rm };
      });
      interestRatePercent = best.rateCandidate;
      const unitBase = best.unitBase;
      const rm = best.rm;
      const targetMultiplier = estimatedCurrentPeriodCosts / (unitBase * 100);
      const multLow = Math.max(1, Math.round(targetMultiplier * 0.6));
      const multHigh = Math.max(multLow + 1, Math.round(targetMultiplier * 1.3));
      const loanAmountBase = unitBase * randInt(multLow, multHigh);
      loanAmount = loanAmountBase * 100;
      interest = loanAmount * rm / 1200;
      const fyStart = fyMonthToDate(CURRENT_FY, 1);
      paymentMonth = fyStart.month === 1 ? 12 : 3;
    }
    const availableForComponents = capitalizeInterest ? totalCost - interest : totalCost;

    const totalCostBase2 = availableForComponents / 100;
    let priorCIPBase, materialsBase, laborBase, expensesBase, guard = 0;
    do {
      const priorMin = Math.ceil(totalCostBase2 * 0.55);
      const priorMax = Math.max(priorMin + 1, Math.floor(totalCostBase2 * 0.75));
      priorCIPBase = randInt(priorMin, priorMax);
      const remaining = totalCostBase2 - priorCIPBase;
      const matPct = randInt(15, 50);
      const labPct = randInt(15, Math.min(50, 85 - matPct));
      materialsBase = Math.max(1, Math.round(remaining * matPct / 100));
      laborBase = Math.max(1, Math.round(remaining * labPct / 100));
      expensesBase = remaining - materialsBase - laborBase;
      guard++;
    } while ((expensesBase <= 0 || priorCIPBase <= materialsBase + laborBase + expensesBase) && guard < 200);
    const priorCIP = priorCIPBase * 100;
    const materials = materialsBase * 100;
    const labor = laborBase * 100;
    const expenses = expensesBase * 100;

    let acqDateStr;
    if (useFYStart) {
      acqDateStr = fyStartDateStr(CURRENT_FY);
    } else {
      const fyMonth = 13 - months;
      const d = fyMonthToDate(CURRENT_FY, fyMonth);
      acqDateStr = hasLoan ? dateStr(d.year, d.month) : dateStrAnyDay(d.year, d.month);
    }

    const constructionStart = pastDate(randInt(1, 3));
    const constructionStartStr = dateStrAnyDay(constructionStart.year, constructionStart.month);
    const fyStartStr = fyStartDateStr(CURRENT_FY);

    const loanClause = hasLoan
      ? 'この工事のため' + fyStartStr + 'に' + yen(loanAmount) + 'を年利率' + interestRatePercent + '%(利払年1回、' + paymentMonth + '月末)で借り入れており、稼働前の期間に対応する借入資本の利子は、' + (capitalizeInterest ? '取得原価に算入する' : '取得原価に算入せず、期間費用として処理する') + '。'
      : '';

    const depLabel = residual === 0 ? '取得原価 ÷ 耐用年数' : '(取得原価 − 残存価額) ÷ 耐用年数';
    const depCalc = residual === 0 ? yen(totalCost) + ' ÷ ' + years : '(' + yen(totalCost) + ' − ' + yen(residual) + ') ÷ ' + years;
    const proRateSteps = useFYStart
      ? '<div class="step">当期首(' + acqDateStr + ')に完成し使用を開始しているため、当期は1年分の減価償却費を計上する</div>' +
        '<div class="step">当期の減価償却費 = ' + depLabel + '</div>' +
        '<div class="step formula">' + depCalc + ' = ' + yen(answer) + '</div>'
      : '<div class="step">完成日から当期末までの使用月数は' + months + 'か月なので月割計算する</div>' +
        '<div class="step">年間の減価償却費 = ' + depLabel + '</div>' +
        '<div class="step">' + depCalc + ' = ' + yen(annual) + '</div>' +
        '<div class="step formula">当期分 = ' + yen(annual) + ' × ' + months + ' ÷ 12 = ' + yen(answer) + '</div>';

    return {
      level: '1', category: '自家建設',
      question: '当社は' + constructionStartStr + 'から' + item + 'を自家建設しており、建設仮勘定の期首残高は' + yen(priorCIP) + 'であった。当期に、材料費' + yen(materials) + '、労務費' + yen(labor) + '、経費' + yen(expenses) + 'を追加で投入し、' + acqDateStr + 'に完成して使用を開始した。' + loanClause + residualText(residualRate) + '、耐用年数 ' + years + '年の定額法により減価償却する場合、当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。',
      answer,
      explain: '<div class="step">建設仮勘定の残高に当期投入分を加算し、取得原価を計算する</div>' +
        (hasLoan
          ? (capitalizeInterest
            ? '<div class="step">当期首(' + fyStartStr + ')から完成日(' + acqDateStr + ')までの稼働前の期間は' + monthsSinceFYStart + 'か月なので月割計算する</div>' +
              '<div class="step">借入資本の利子 = 借入額 × 年利率 × 稼働前の月数 ÷ 12</div>' +
              '<div class="step">' + yen(loanAmount) + ' × ' + interestRatePercent + '% × ' + monthsSinceFYStart + 'か月 ÷ 12 = ' + yen(interest) + '</div>' +
              '<div class="step">稼働前の期間に対応する借入資本の利子は取得原価に算入する</div>'
            : '<div class="step">稼働前の期間に対応する借入資本の利子は取得原価に算入せず、支払利息として期間費用として処理する</div>')
          : '') +
        '<div class="step">取得原価 = 建設仮勘定期首残高 + 材料費 + 労務費 + 経費' + (hasLoan && capitalizeInterest ? ' + 借入資本の利子' : '') + '</div>' +
        '<div class="step formula">' + yen(priorCIP) + ' + ' + yen(materials) + ' + ' + yen(labor) + ' + ' + yen(expenses) + (hasLoan && capitalizeInterest ? ' + ' + yen(interest) : '') + ' = ' + yen(totalCost) + '</div>' +
        '<div class="step" style="margin-top:16px;">取得原価が確定したところから減価償却を開始する</div>' +
        proRateSteps
    };
  }

  function genAssetRetirement() {
    const item = pick(['機械装置', '備品']);
    const rateOptions = { 4: [26, 25], 5: [21, 20], 8: [27, 25], 10: [11, 10] };
    const yearsOptions = { 4: [3], 5: [3, 4], 8: [3], 10: [3, 4] };
    const ratePercent = pick([4, 5, 8, 10]);
    const [numer, denomBase] = rateOptions[ratePercent];
    const years = pick(yearsOptions[ratePercent]);
    const residualRate = 0;
    const useFYStart = Math.random() < 0.4;
    let pf, useFixedMidYearDate = false;
    if (!useFYStart) {
      useFixedMidYearDate = Math.random() < 0.5;
      if (useFixedMidYearDate) {
        const fixedMonths = fixedTrapMonths();
        pf = { months: fixedMonths, multipleNeeded: 12 / gcd(12, fixedMonths) };
      } else {
        pf = periodFactor();
      }
    }

    const factor = useFYStart ? 1 : pf.multipleNeeded;
    const denomPow = Math.pow(denomBase, years);
    const numerPow = Math.pow(numer, years);

    let multiplier = randInt(4000, 12000);
    let annualBase, fullYearAnnual, depreciableAmount, totalCost, residual;
    for (let attempt = 0; attempt < 40; attempt++) {
      annualBase = factor * multiplier;
      fullYearAnnual = annualBase * 10;
      depreciableAmount = fullYearAnnual * years;
      totalCost = depreciableAmount;
      residual = 0;
      if (totalCost >= denomPow * 6) break;
      multiplier += Math.max(2, Math.ceil(multiplier / 2));
    }

    let j = Math.max(1, Math.round(totalCost / 12 / denomPow));
    let pv = denomPow * j;
    let removalCost = numerPow * j;
    let baseCost = totalCost - pv;
    let guard = 0;
    while ((baseCost < 200000 || pv > baseCost * 0.4) && j > 1 && guard < 20) {
      j -= 1;
      pv = denomPow * j;
      removalCost = numerPow * j;
      baseCost = totalCost - pv;
      guard++;
    }

    const answer = useFYStart ? fullYearAnnual : Math.round(fullYearAnnual * pf.months / 12);
    let acqDateStr;
    if (useFYStart) {
      acqDateStr = fyStartDateStr(CURRENT_FY);
    } else {
      const fyMonth = 13 - pf.months;
      const d = fyMonthToDate(CURRENT_FY, fyMonth);
      acqDateStr = useFixedMidYearDate ? dateStr(d.year, d.month) : dateStrAnyDay(d.year, d.month);
    }
    const rateDisplay = '0.' + (ratePercent < 10 ? '0' + ratePercent : ratePercent);

    return {
      level: '1', category: '資産除去債務',
      question: acqDateStr + 'に' + item + '(取得原価 ' + yen(baseCost) + '、耐用年数 ' + years + '年、' + residualText(residualRate) + '、定額法により償却)を取得した。当社には当該' + item + 'を使用後に除去する法的義務があり、除去する際の支出は' + yen(removalCost) + 'と見積もられた。割引率は' + ratePercent + '%とする。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。',
      answer,
      explain: '<div class="step">資産除去債務の計上額(現在価値) = 除去費用 ÷ (1 + 割引率)^' + years + '</div>' +
        '<div class="step">' + yen(removalCost) + ' ÷ (1 + ' + rateDisplay + ')^' + years + ' = ' + yen(pv) + '</div>' +
        '<div class="step">取得原価 = 本体の取得原価 + 資産除去債務の計上額</div>' + '<div class="step formula">' + yen(baseCost) + ' + ' + yen(pv) + ' = ' + yen(totalCost) + '</div>' +
        (useFYStart
          ? '<div class="step" style="margin-top:16px;">当期首(' + acqDateStr + ')に取得しているため、当期は1年分の減価償却費を計上する</div>' +
            '<div class="step">当期の減価償却費 = ' + (residual === 0 ? '取得原価 ÷ 耐用年数' : '(取得原価 − 残存価額) ÷ 耐用年数') + '</div>' +
            '<div class="step formula">' + (residual === 0 ? yen(totalCost) : '(' + yen(totalCost) + ' − ' + yen(residual) + ')') + ' ÷ ' + years + ' = ' + yen(answer) + '</div>'
          : '<div class="step" style="margin-top:16px;">取得日から当期末までの使用月数は' + pf.months + 'か月なので月割計算する</div>' +
            '<div class="step">年間の減価償却費 = ' + (residual === 0 ? '取得原価 ÷ 耐用年数' : '(取得原価 − 残存価額) ÷ 耐用年数') + '</div>' +
            '<div class="step">' + (residual === 0 ? yen(totalCost) : '(' + yen(totalCost) + ' − ' + yen(residual) + ')') + ' ÷ ' + years + ' = ' + yen(fullYearAnnual) + '</div>' +
            '<div class="step formula">当期分 = ' + yen(fullYearAnnual) + ' × ' + pf.months + ' ÷ 12 = ' + yen(answer) + '</div>')
    };
  }

  /* ---------- 1級: 資産除去債務(見積りの変更) ---------- */
  function genAssetRetirementEstimateChange() {
    const item = pick(['機械装置', '備品']);
    const rateOptions = { 4: [26, 25], 5: [21, 20], 8: [27, 25], 10: [11, 10] };
    const yearsOptions = { 4: [3], 5: [3, 4], 8: [3], 10: [3, 4] };
    let ratePercent1, years, remainingYears;
    do {
      ratePercent1 = pick([4, 5, 8, 10]);
      years = pick(yearsOptions[ratePercent1]);
      remainingYears = years - 1;
    } while (remainingYears < 1);
    const [numer1, denom1] = rateOptions[ratePercent1];
    const denomPow1 = Math.pow(denom1, years);
    const numerPow1 = Math.pow(numer1, years);

    const isIncrease = Math.random() < 0.5;
    const ratePercent2 = ratePercent1 + (Math.random() < 0.5 ? 1 : -1);

    const residualRate = 0;
    const minBase = Math.max(2000, Math.ceil(denomPow1 / years / 100 * 3));
    const annual1Base = randInt(minBase, minBase * 6);
    const annual1 = annual1Base * 100;
    const depreciableAmount = annual1 * years;
    const totalCost1 = depreciableAmount;
    const residual = 0;

    let j1 = Math.max(1, Math.round(totalCost1 / 12 / denomPow1));
    let pv1 = denomPow1 * j1;
    let removalCost1 = numerPow1 * j1;
    let baseCost1 = totalCost1 - pv1;
    let guard = 0;
    while ((baseCost1 <= 0 || pv1 > baseCost1 * 0.4) && j1 > 1 && guard < 20) {
      j1 -= 1;
      pv1 = denomPow1 * j1;
      removalCost1 = numerPow1 * j1;
      baseCost1 = totalCost1 - pv1;
      guard++;
    }

    const bvBeforeChange = totalCost1 - annual1;

    const usedRate = (isIncrease ? ratePercent2 : ratePercent1) / 100;
    const maxDelta = Math.floor(removalCost1 * 0.2 / 100) * 100;
    if (maxDelta < 100) return genAssetRetirementEstimateChange();
    const deltaRemovalCost = randInt(1, Math.max(1, Math.floor(maxDelta / 100))) * 100;
    const deltaPV = Math.round(deltaRemovalCost / Math.pow(1 + usedRate, remainingYears));
    const newRemovalCost = isIncrease ? removalCost1 + deltaRemovalCost : removalCost1 - deltaRemovalCost;

    const bvAfterChange = isIncrease ? bvBeforeChange + deltaPV : bvBeforeChange - deltaPV;
    const answer = Math.round((bvAfterChange - residual) / remainingYears);

    const rateDisplay1 = '0.' + (ratePercent1 < 10 ? '0' + ratePercent1 : ratePercent1);
    const rateDisplay2 = '0.' + (ratePercent2 < 10 ? '0' + ratePercent2 : ratePercent2);
    const acq = pastFYStart(1);
    const acqDateStr = dateStr(acq.year, acq.month);
    const changeDateStr = fyStartDateStr(CURRENT_FY);

    const usedRateForDelta = isIncrease ? ratePercent2 : ratePercent1;
    const usedRateDisplayForDelta = isIncrease ? rateDisplay2 : rateDisplay1;

    return {
      level: '1', category: '資産除去債務(見積りの変更)',
      question: acqDateStr + 'に' + item + '(取得原価 ' + yen(baseCost1) + '、耐用年数 ' + years + '年、' + residualText(residualRate) + '、定額法により償却)を取得した。当社には当該' + item + 'を使用後に除去する法的義務があり、除去する際の支出は' + yen(removalCost1) + 'と見積もられた。割引率は' + ratePercent1 + '%とする。' + changeDateStr + '、除去費用の見積りを' + yen(newRemovalCost) + 'に変更した。変更時の割引率は' + ratePercent2 + '%とする。当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい(計算の過程で端数が生じる場合は円未満四捨五入)。',
      answer,
      explain: '<div class="step">資産除去債務の当初計上額(現在価値) = 除去費用 ÷ (1 + 割引率)^' + years + '</div>' +
        '<div class="step">' + yen(removalCost1) + ' ÷ (1 + ' + rateDisplay1 + ')^' + years + ' = ' + yen(pv1) + '</div>' +
        '<div class="step">取得原価 = 本体の取得原価 + 資産除去債務の当初計上額</div>' +
        '<div class="step">' + yen(baseCost1) + ' + ' + yen(pv1) + ' = ' + yen(totalCost1) + '</div>' +
        '<div class="step">前期の減価償却費 = ' + (residual === 0 ? '取得原価 ÷ 耐用年数' : '(取得原価 − 残存価額) ÷ 耐用年数') + '</div>' +
        '<div class="step">' + (residual === 0 ? yen(totalCost1) : '(' + yen(totalCost1) + ' − ' + yen(residual) + ')') + ' ÷ ' + years + ' = ' + yen(annual1) + '</div>' +
        '<div class="step formula">前期末(見積り変更前)の帳簿価額 = ' + yen(totalCost1) + ' − ' + yen(annual1) + ' = ' + yen(bvBeforeChange) + '</div>' +
        '<div class="step" style="margin-top:16px;">見積りの変更額 = ' + yen(newRemovalCost) + ' − ' + yen(removalCost1) + ' = ' + (isIncrease ? '' : '−') + yen(Math.abs(deltaRemovalCost)) + '(除去費用の' + (isIncrease ? '増加' : '減少') + ')</div>' +
        '<div class="step">除去費用が' + (isIncrease ? '増加した場合は変更時点の割引率' : '減少した場合は変更時点の割引率(' + ratePercent2 + '%)は使用せず、当初の割引率') + '(' + usedRateForDelta + '%)を用いて、残存耐用年数' + remainingYears + '年で割り引く</div>' +
        '<div class="step formula">見積り変更による調整額 = ' + yen(Math.abs(deltaRemovalCost)) + ' ÷ (1 + ' + usedRateDisplayForDelta + ')^' + remainingYears + ' = ' + yen(deltaPV) + '</div>' +
        '<div class="step" style="margin-top:16px;">変更後の帳簿価額 = ' + yen(bvBeforeChange) + ' ' + (isIncrease ? '+' : '−') + ' ' + yen(deltaPV) + ' = ' + yen(bvAfterChange) + '</div>' +
        '<div class="step">当期の減価償却費 = ' + (residual === 0 ? '変更後の帳簿価額 ÷ 残存耐用年数' : '(変更後の帳簿価額 − 残存価額) ÷ 残存耐用年数') + '</div>' +
        '<div class="step formula">' + (residual === 0 ? yen(bvAfterChange) : '(' + yen(bvAfterChange) + ' − ' + yen(residual) + ')') + ' ÷ ' + remainingYears + ' = ' + yen(answer) + '</div>'
    };
  }

  /* ---------- 1級: 一括購入(建物付土地の按分計算) ---------- */
  function genLumpSumPurchase() {
    const residualRate = pickResidualRate();
    const acqPeriod = determineAcqPeriod(0.3, 30/70);
    const useFYStart = acqPeriod.useFYStart, useFixedMidYearDate = acqPeriod.useFixedMidYearDate;
    const months = acqPeriod.months, multipleNeeded = acqPeriod.multipleNeeded;
    const factor = residualRate === 0 ? multipleNeeded : lcm(multipleNeeded, 9);
    const years = pick(BUILDING_YEARS);
    const landHigherPairs = [[1, 2], [2, 3], [3, 4], [2, 5], [3, 5], [1, 3], [1, 4]];
    const buildingHigherPairs = [[2, 1], [3, 2], [4, 3], [5, 2], [5, 3]];
    const equalPairs = [[1, 1]];
    const ratioRoll = Math.random();
    const ratioPairs = ratioRoll < 0.65 ? landHigherPairs : (ratioRoll < 0.90 ? buildingHigherPairs : equalPairs);
    const [a, b] = pick(ratioPairs);
    const perUnit = factor * (residualRate === 0 ? randInt(30, 180) : randInt(30, 50));
    const innerK = perUnit * years * (residualRate === 0 ? 1 : 10 / 9);
    const buildingCostUnits = a * innerK;
    const landCostUnits = b * innerK;
    const depreciableUnits = perUnit * years * a;
    const residualUnits = buildingCostUnits - depreciableUnits;

    const baseUnit = 1000;
    const buildingCost = buildingCostUnits * baseUnit;
    const landCost = landCostUnits * baseUnit;
    const totalPrice = buildingCost + landCost;
    const residual = residualUnits * baseUnit;

    const annualBaseUnits = a * perUnit;
    const annual = annualBaseUnits * baseUnit;
    const answer = useFYStart ? annual : Math.round(annual * months / 12);

    const perUnitCost = innerK * baseUnit;
    const fvUnit = Math.ceil(perUnitCost * randInt(100, 111) / 100 / 1000) * 1000;
    const buildingFV = a * fvUnit;
    const landFV = b * fvUnit;
    const depreciationDesc = residualRate === 0 ? '建物の減価償却は残存価額ゼロ、定額法により行っている。' : '建物の減価償却は残存価額を取得原価の10%とし、定額法により行っている。';

    let acqDateStr;
    if (useFYStart) {
      acqDateStr = fyStartDateStr(CURRENT_FY);
    } else {
      const fyMonth = 13 - months;
      const d = fyMonthToDate(CURRENT_FY, fyMonth);
      acqDateStr = useFixedMidYearDate ? dateStr(d.year, d.month) : dateStrAnyDay(d.year, d.month);
    }

    return {
      level: '1', category: '一括購入(按分計算)',
      question: acqDateStr + 'に、建物付土地を' + yen(totalPrice) + 'で購入した。購入時における建物の時価は' + yen(buildingFV) + '、土地の時価は' + yen(landFV) + 'であった。取得した建物の耐用年数は' + years + '年である。' + depreciationDesc + '当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。',
      answer,
      explain: '<div class="step">複数の資産を一括で購入した場合、購入価額を各資産の時価の比率で按分する</div>' +
        '<div class="step">建物の取得原価 = 購入価額 × 建物の時価 ÷ (建物の時価 + 土地の時価)</div>' + '<div class="step formula">' + yen(totalPrice) + ' × ' + yen(buildingFV) + ' ÷ (' + yen(buildingFV) + ' + ' + yen(landFV) + ') = ' + yen(buildingCost) + '</div>' +
        (useFYStart
          ? '<div class="step" style="margin-top:16px;">当期首(' + acqDateStr + ')に取得しているため、当期は1年分の減価償却費を計上する</div>' +
            '<div class="step">当期の減価償却費 = ' + (residual === 0 ? '建物の取得原価 ÷ 耐用年数' : '(建物の取得原価 − 残存価額) ÷ 耐用年数') + '</div>' +
            '<div class="step formula">' + (residual === 0 ? yen(buildingCost) : '(' + yen(buildingCost) + ' − ' + yen(residual) + ')') + ' ÷ ' + years + ' = ' + yen(answer) + '</div>'
          : '<div class="step" style="margin-top:16px;">取得日から当期末までの使用月数は' + months + 'か月なので月割計算する</div>' +
            '<div class="step">年間の減価償却費 = ' + (residual === 0 ? '建物の取得原価 ÷ 耐用年数' : '(建物の取得原価 − 残存価額) ÷ 耐用年数') + '</div>' +
            '<div class="step">' + (residual === 0 ? yen(buildingCost) : '(' + yen(buildingCost) + ' − ' + yen(residual) + ')') + ' ÷ ' + years + ' = ' + yen(annual) + '</div>' +
            '<div class="step formula">当期の減価償却費 = ' + yen(annual) + ' × ' + months + ' ÷ 12 = ' + yen(answer) + '</div>')
    };
  }

  /* ---------- 1級: 一括購入(新築目的で建物付土地を購入) ---------- */
  function genLumpSumPurchaseNewConstruction() {
    const residualRate = pickResidualRate();
    const acqPeriod = determineAcqPeriod(0.3, 30/70);
    const useFYStart = acqPeriod.useFYStart, useFixedMidYearDate = acqPeriod.useFixedMidYearDate;
    const months = acqPeriod.months, multipleNeeded = acqPeriod.multipleNeeded;
    const factor = residualRate === 0 ? multipleNeeded : lcm(multipleNeeded, 9);
    const years = pick(BUILDING_YEARS);
    const ratioPairs = [[1, 4], [1, 3], [1, 5], [2, 7], [1, 6], [1, 2]];
    const [a, b] = pick(ratioPairs);
    const perUnit = factor * (residualRate === 0 ? randInt(30, 150) : randInt(30, 40));
    const innerK = perUnit * years * (residualRate === 0 ? 1 : 10 / 9);
    const buildingCostUnits = a * innerK;
    const landCostUnits = b * innerK;
    const baseUnit = 1000;
    const totalPrice = (buildingCostUnits + landCostUnits) * baseUnit;
    const depreciationDesc = residualRate === 0 ? '建物の減価償却は残存価額ゼロ、定額法により行っている。' : '建物の減価償却は残存価額を取得原価の10%とし、定額法により行っている。';

    const perUnitPrice = totalPrice / (a + b);
    const fvUnit = Math.ceil(perUnitPrice * randInt(100, 111) / 100 / 1000) * 1000;
    const buildingFV = a * fvUnit;
    const landFV = b * fvUnit;

    let acqDateStr;
    if (useFYStart) {
      acqDateStr = fyStartDateStr(CURRENT_FY);
    } else {
      const fyMonth = 13 - months;
      const d = fyMonthToDate(CURRENT_FY, fyMonth);
      acqDateStr = useFixedMidYearDate ? dateStr(d.year, d.month) : dateStrAnyDay(d.year, d.month);
    }

    return {
      level: '1', category: '一括購入(新築目的)',
      question: acqDateStr + 'に、建物付土地を' + yen(totalPrice) + 'で購入した。この土地は新社屋を建設する目的で取得したものである。購入時における建物の時価は' + yen(buildingFV) + '、土地の時価は' + yen(landFV) + 'であった。取得した建物の耐用年数は' + years + '年である。' + depreciationDesc + '当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。',
      answer: 0,
      explain: '<div class="step">新築を目的として建物付土地を取得し、取得後ただちに建物を取り壊す場合、建物の時価や残存耐用年数にかかわらず、購入価額の全額を土地の取得原価とする</div>' +
        '<div class="step formula">土地の取得原価 = ' + yen(totalPrice) + '(建物への配分は行わない)</div>' +
        '<div class="step" style="margin-top:16px;">土地は減価償却を行わない資産であるため、当期の減価償却費はゼロとなる</div>' +
        '<div class="step formula">当期の減価償却費 = ¥0</div>'
    };
  }

  /* ---------- 1級: 在外支店・在外子会社 ---------- */
  function usd(n) { return Math.round(n).toLocaleString('ja-JP') + 'ドル'; }
  function fyEndDateStr(fy) {
    return FY_START_MONTH === 4 ? 'X' + (fy + 1) + '年3月31日' : 'X' + fy + '年12月31日';
  }
  function fyRangeStr(fy) { return fyStartDateStr(fy) + '～' + fyEndDateStr(fy); }
  function genForeignOperation() {
    const isBranch = Math.random() < 0.5;
    const item = pick(['備品', '備品', '機械装置', '車両運搬具', '建物']);
    const years = yearsForItem(item, YEARS);
    const residualRate = pickResidualRate();
    // 取得時期:当期取得(期首・期中)が半分、前期以前(1〜2期前)が半分
    const elapsed = Math.random() < 0.5 ? 0 : randInt(1, Math.min(2, years - 1));
    let useFYStart = true, months = 12, multipleNeeded = 1, acqDateStr;
    const acqFY = CURRENT_FY - elapsed;
    if (elapsed === 0) {
      const acq = determineAcqPeriod(0.4, 0.4);
      useFYStart = acq.useFYStart; months = acq.months; multipleNeeded = acq.multipleNeeded;
      if (useFYStart) {
        acqDateStr = fyStartDateStr(CURRENT_FY);
      } else {
        const d = fyMonthToDate(CURRENT_FY, 13 - months);
        acqDateStr = acq.useFixedMidYearDate ? dateStr(d.year, d.month) : dateStrAnyDay(d.year, d.month);
      }
    } else {
      const d = fyMonthToDate(acqFY, randInt(1, 12));
      acqDateStr = d.month === FY_START_MONTH ? dateStr(d.year, d.month) : dateStrAnyDay(d.year, d.month);
    }
    const factor = residualRate === 0 ? multipleNeeded : lcm(multipleNeeded, 9);
    const unit = years * 100 * factor;
    const lowUSD = item === '建物' ? 500000 : 10000, highUSD = item === '建物' ? 20000000 : 2000000;
    const lo = Math.max(1, Math.ceil(lowUSD / unit)), hi = Math.max(lo + 3, Math.floor(highUSD / unit));
    const annualUSD = factor * randInt(lo, hi) * 100;
    const costUSD = residualRate === 0 ? annualUSD * years : annualUSD * years * 10 / 9;
    const residualUSD = costUSD - annualUSD * years;
    const depUSD = elapsed === 0 && !useFYStart ? annualUSD * months / 12 : annualUSD;

    // 為替相場(取得日 → 各期の期中平均・期末)。表の中で同じレートが重ならないようにする
    const rates = [];
    const hr = randInt(95, 150);
    rates.push({ label: acqDateStr, rate: hr, kind: 'hr' });
    let prevEnd = hr + randInt(-6, 6);
    for (let fy = acqFY; fy <= CURRENT_FY; fy++) {
      const end = Math.max(85, prevEnd + randInt(-12, 12));
      const ar = Math.round((prevEnd + end) / 2) + randInt(-2, 2);
      rates.push({ label: fyRangeStr(fy), rate: ar, kind: fy === CURRENT_FY ? 'ar' : 'past' });
      rates.push({ label: fyEndDateStr(fy), rate: end, kind: fy === CURRENT_FY ? 'cr' : 'past' });
      prevEnd = end;
    }
    // 表の中で同じレートが重ならないようにする(重なったら1円ずつずらす)
    const seen = new Set();
    rates.forEach(function (x) {
      const step = Math.random() < 0.5 ? 1 : -1;
      while (seen.has(x.rate) || x.rate < 80) x.rate += x.rate < 80 ? 1 : step;
      seen.add(x.rate);
    });
    const rateOf = function (kind) { return rates.find(function (x) { return x.kind === kind; }); };
    const subUseCR = !isBranch && Math.random() < 0.4;
    const used = isBranch ? rateOf('hr') : (subUseCR ? rateOf('cr') : rateOf('ar'));
    const answer = depUSD * used.rate;

    const table = '<table class="je-table" style="margin-top:10px;"><tr><td style="text-align:center;font-weight:700;">日付・期間</td><td class="je-amt" style="text-align:center;font-weight:700;">為替相場</td></tr>' +
      rates.map(function (x) { return '<tr><td>' + x.label + '</td><td class="je-amt" style="white-space:nowrap;">1ドル=' + x.rate + '円</td></tr>'; }).join('') + '</table>';
    const who = isBranch ? '在外支店' : '在外子会社';
    const question = '当社の' + who + 'は、' + acqDateStr + 'に' + item + '(取得原価 ' + usd(costUSD) + '、' + residualText(residualRate) + '、耐用年数 ' + years + '年)を取得し、定額法により減価償却している。為替相場は次のとおりである。' +
      (isBranch ? '' : 'なお、' + who + 'の収益及び費用は' + (subUseCR ? '決算時の為替相場' : '期中平均相場') + 'により換算する。') +
      (isBranch ? '本店の財務諸表と合算するために在外支店の財務諸表を換算する場合' : '連結財務諸表を作成するために在外子会社の財務諸表を換算する場合') +
      '、当期(' + fyLabel(CURRENT_FY) + ')の減価償却費を求めなさい。' + table;

    let periodNote;
    if (elapsed > 0) periodNote = '<div class="step">取得日(' + acqDateStr + ')は前期以前のため、当期は1年分の減価償却費を計上する</div>';
    else if (useFYStart) periodNote = '<div class="step">当期首(' + acqDateStr + ')に取得しているため、当期は1年分の減価償却費を計上する</div>';
    else periodNote = '<div class="step">取得日から当期末までの使用月数は' + months + 'か月なので月割計算する</div>';
    const usdSteps = (residualUSD === 0
      ? '<div class="step">年間の減価償却費 = 取得原価 ÷ 耐用年数</div><div class="step">' + usd(costUSD) + ' ÷ ' + years + ' = ' + usd(annualUSD) + '</div>'
      : '<div class="step">年間の減価償却費 = (取得原価 − 残存価額) ÷ 耐用年数</div><div class="step">(' + usd(costUSD) + ' − ' + usd(residualUSD) + ') ÷ ' + years + ' = ' + usd(annualUSD) + '</div>') +
      (depUSD !== annualUSD ? '<div class="step">当期分 = ' + usd(annualUSD) + ' × ' + months + ' ÷ 12 = ' + usd(depUSD) + '</div>' : '');
    const rateNote = isBranch
      ? '<div class="step">在外支店の固定資産は取得時の為替相場で換算し、その費用化額である減価償却費も同じく取得時の為替相場(' + used.label + ':1ドル=' + used.rate + '円)で換算する</div>'
      : '<div class="step">在外子会社の収益及び費用は、問題文の指示により' + (subUseCR ? '決算時の為替相場(' + used.label + ':1ドル=' + used.rate + '円)' : '期中平均相場(' + used.label + ':1ドル=' + used.rate + '円)') + 'で換算する</div>';
    const explain = rateNote +
      '<div class="step" style="margin-top:16px;">まず外貨(ドル)で当期の減価償却費を求める</div>' + periodNote + usdSteps +
      '<div class="step" style="margin-top:16px;">円換算額 = 外貨建ての減価償却費 × 為替相場</div>' +
      '<div class="step formula">' + usd(depUSD) + ' × ' + used.rate + '円 = ' + yen(answer) + '</div>';

    return {
      level: '1', category: (isBranch ? '在外支店' : '在外子会社・' + (subUseCR ? '決算時の為替相場' : '期中平均相場')) + '(' + (elapsed === 0 && !useFYStart ? '月割' : '年間') + ')',
      assetCost: costUSD * rateOf('hr').rate,
      question: question,
      answer: answer,
      explain: explain
    };
  }

  /* ---------- 1級: 連結未実現利益(償却性資産) ---------- */
  function genConsolidatedUnrealized() {
    const isDown = Math.random() < 0.5;
    const seller = isDown ? 'P社' : 'S社', buyer = isDown ? 'S社' : 'P社';
    const ratio = pick([60, 70, 75, 80, 90]);
    const item = pick(['備品', '備品', '機械装置', '車両運搬具']);
    const years = pick(YEARS);
    const r = Math.random();
    const elapsed = r < 0.5 ? 0 : (r < 0.8 ? 1 : Math.min(2, years - 1));
    let useFYStart = true, months = 12, multipleNeeded = 1, saleDateStr;
    if (elapsed === 0) {
      const acq = determineAcqPeriod(0.4, 0.4);
      useFYStart = acq.useFYStart; months = acq.months; multipleNeeded = acq.multipleNeeded;
      if (useFYStart) {
        saleDateStr = fyStartDateStr(CURRENT_FY);
      } else {
        const d = fyMonthToDate(CURRENT_FY, 13 - months);
        saleDateStr = acq.useFixedMidYearDate ? dateStr(d.year, d.month) : dateStrAnyDay(d.year, d.month);
      }
    } else {
      const d = fyMonthToDate(CURRENT_FY - elapsed, randInt(1, 12));
      saleDateStr = d.month === FY_START_MONTH ? dateStr(d.year, d.month) : dateStrAnyDay(d.year, d.month);
    }
    const unit = years * multipleNeeded * 100;
    const bvLo = Math.ceil(600000 / unit), bvHi = Math.max(bvLo + 3, Math.floor(8000000 / unit));
    const bv = unit * randInt(bvLo, bvHi);
    const gain = Math.max(unit, Math.round(bv * randInt(10, 40) / 100 / unit) * unit);
    const price = bv + gain;
    const mf = elapsed === 0 && !useFYStart ? months : 12;
    const buyerDep = price / years * mf / 12;
    const adjust = gain / years * mf / 12;
    const answer = buyerDep - adjust;

    const question = 'P社はS社の発行済株式の' + ratio + '%を所有し、支配している。' + seller + 'は' + saleDateStr + 'に、帳簿価額 ' + yen(bv) + 'の' + item + 'を' + buyer + 'に' + yen(price) + 'で売却した。' +
      buyer + 'はこの' + item + 'を、残存価額はゼロ、耐用年数 ' + years + '年の定額法により減価償却している。当期(' + fyLabel(CURRENT_FY) + ')の連結損益計算書に計上される、この' + item + 'に係る減価償却費を求めなさい。';

    const mfText = mf === 12 ? '' : ' × ' + mf + ' ÷ 12';
    let periodNote;
    if (elapsed > 0) periodNote = '<div class="step">売却日(' + saleDateStr + ')は前期以前のため、当期は1年分の減価償却費を計上する(前期以前の修正は開始仕訳で処理済みのため、当期の減価償却費には含めない)</div>';
    else if (useFYStart) periodNote = '<div class="step">当期首(' + saleDateStr + ')に売却しているため、当期は1年分の減価償却費を計上する</div>';
    else periodNote = '<div class="step">売却日から当期末までの使用月数は' + months + 'か月なので月割計算する</div>';
    const explain = '<div class="step">連結上は、グループ内部の取引で生じた未実現利益を消去するため、' + buyer + 'の減価償却費のうち未実現利益に対応する分を減額する</div>' +
      (isDown ? '' : '<div class="step">アップストリームの場合、未実現利益の消去額は非支配株主持分にも負担させるが、連結損益計算書上の減価償却費の金額には影響しない</div>') +
      '<div class="step">未実現利益 = 売却価額 − 売却時の帳簿価額</div>' +
      '<div class="step">' + yen(price) + ' − ' + yen(bv) + ' = ' + yen(gain) + '</div>' +
      periodNote.replace('<div class="step">', '<div class="step" style="margin-top:16px;">') +
      '<div class="step">' + buyer + 'の減価償却費 = 売却価額 ÷ 耐用年数' + (mf === 12 ? '' : ' × 使用月数 ÷ 12') + '</div>' +
      '<div class="step">' + yen(price) + ' ÷ ' + years + mfText + ' = ' + yen(buyerDep) + '</div>' +
      '<div class="step">未実現利益に対応する減価償却費 = 未実現利益 ÷ 耐用年数' + (mf === 12 ? '' : ' × 使用月数 ÷ 12') + '</div>' +
      '<div class="step">' + yen(gain) + ' ÷ ' + years + mfText + ' = ' + yen(adjust) + '</div>' +
      '<div class="step" style="margin-top:16px;">連結上の減価償却費 = ' + buyer + 'の減価償却費 − 未実現利益に対応する減価償却費</div>' +
      '<div class="step formula">' + yen(buyerDep) + ' − ' + yen(adjust) + ' = ' + yen(answer) + '</div>';

    return {
      level: '1', category: '連結未実現利益(' + (isDown ? 'ダウンストリーム' : 'アップストリーム') + '・' + (mf === 12 ? '年間' : '月割') + ')',
      assetCost: bv,
      question: question,
      answer: answer,
      explain: explain
    };
  }

  const TOPICS = [
    { id: 'straight', label: '定額法', levels: ['3', '2'] },
    { id: 'incidental', label: '付随費用', levels: ['3'] },
    { id: 'declining', label: '定率法', levels: ['2'] },
    { id: 'production', label: '生産高比例法', levels: ['2'] },
    { id: 'sumofyears', label: '級数法', levels: ['1'] },
    { id: 'group', label: '総合償却', levels: ['1'] },
    { id: 'intangible', label: '無形固定資産', levels: ['2'] },
    { id: 'deferred', label: '繰延資産', levels: ['1'] },
    { id: 'lease', label: 'リース資産', levels: ['2', '1'] },
    { id: 'installment', label: '割賦購入', levels: ['2'] },
    { id: 'exchange', label: '交換', levels: ['1'] },
    { id: 'capital', label: '資本的支出', levels: ['1'] },
    { id: 'tradein', label: '買換え', levels: ['2', '1'] },
    { id: 'methodchange', label: '償却方法の変更', levels: ['1'] },
    { id: 'estimatechange', label: '見積り変更', levels: ['1'] },
    { id: 'aro', label: '資産除去債務', levels: ['1'] },
    { id: 'lumpsum', label: '一括購入', levels: ['1'] },
    { id: 'impairment', label: '減損損失', levels: ['1'] },
    { id: 'compression', label: '圧縮記帳', levels: ['2', '1'] },
    { id: 'selfconstruction', label: '自家建設', levels: ['1'] },
    { id: 'software', label: 'ソフトウェア', levels: ['1'] },
    { id: 'foreign', label: '在外支店・在外子会社', levels: ['1'] },
    { id: 'unrealized', label: '連結未実現利益', levels: ['1'] }
  ];

  const PROBLEM_TYPES = [
    { level: '3', topic: 'straight', fn: genStraightLine },
    { level: '3', topic: 'straight', fn: genStraightLineFinalYear3 },
    { level: '2', topic: 'straight', fn: genStraightLineByRate },
    { level: '2', topic: 'straight', fn: genPeriodStraightLineByRate },
    { level: '3', topic: 'straight', fn: genPeriodStraightLine },
    { level: '3', topic: 'incidental', fn: genIncidentalCosts },
    { level: '2', topic: 'declining', fn: genDecliningSimple },
    { level: '2', topic: 'declining', fn: genDecliningSimple },
    { level: '2', topic: 'declining', fn: genDecliningDeriveRate },
    { level: '2', topic: 'declining', fn: genDecliningGuarantee },
    { level: '2', topic: 'declining', fn: genDecliningGuarantee },
    { level: '2', topic: 'straight', fn: genStraightLineFinalYear },
    { level: '2', topic: 'declining', fn: genDecliningFinalYear },
    { level: '2', topic: 'production', fn: genProductionUnits },
    { level: '2', topic: 'production', fn: genProductionUnitsCumulative },
    { level: '2', topic: 'intangible', fn: genIntangibleAmortization },
    { level: '1', topic: 'deferred', fn: genDeferredAssetAmortization },
    { level: '1', topic: 'software', fn: genSoftwareAmortization },
    { level: '2', topic: 'straight', fn: genEstimateFromBookValue },
    { level: '2', topic: 'lease', fn: genLeaseAsset },
    { level: '2', topic: 'installment', fn: genInstallmentPurchase },
    { level: '1', topic: 'lease', fn: genLeaseAssetLevel1, weight: 7 },
    { level: '1', topic: 'lease', fn: genSaleAndLeaseback, weight: 3 },
    { level: '1', topic: 'exchange', fn: genAssetExchange },
    { level: '1', topic: 'sumofyears', fn: genSumOfYearsDigits },
    { level: '1', topic: 'group', fn: genGroupDepreciation, weight: 0.85 },
    { level: '1', topic: 'group', fn: genGroupDepreciationRetirement, weight: 0.15 },
    { level: '1', topic: 'capital', fn: genCapitalExpenditure },
    { level: '2', topic: 'tradein', fn: genAssetTradeInNoFairValue },
    { level: '1', topic: 'tradein', fn: genAssetTradeInWithFairValue },
    { level: '1', topic: 'methodchange', fn: genMethodChange },
    { level: '1', topic: 'methodchange', fn: genMethodChangeToDeclining },
    { level: '1', topic: 'estimatechange', fn: genUsefulLifeChangeStraightRemaining },
    { level: '1', topic: 'estimatechange', fn: genUsefulLifeChangeStraightTotal },
    { level: '1', topic: 'estimatechange', fn: genUsefulLifeChangeDeclining },
    { level: '1', topic: 'estimatechange', fn: genProductionUnitsEstimateChange },
    { level: '1', topic: 'aro', fn: genAssetRetirement },
    { level: '1', topic: 'aro', fn: genAssetRetirementEstimateChange },
    { level: '1', topic: 'lumpsum', fn: genLumpSumPurchase, weight: 7 },
    { level: '1', topic: 'lumpsum', fn: genLumpSumPurchaseNewConstruction, weight: 3 },
    { level: '1', topic: 'impairment', fn: genImpairment },
    { level: '1', topic: 'impairment', fn: genImpairmentDeclining },
    { level: '2', topic: 'compression', fn: genCompressionSubsidy },
    { level: '2', topic: 'compression', fn: genCompressionSubsidyDeclining },
    { level: '1', topic: 'compression', fn: genCompressionReserveMethod },
    { level: '1', topic: 'compression', fn: genCompressionReserveMethodDeclining },
    { level: '1', topic: 'compression', fn: genCompressionInsurance },
    { level: '1', topic: 'selfconstruction', fn: genSelfConstruction },
    { level: '1', topic: 'foreign', fn: genForeignOperation },
    { level: '1', topic: 'unrealized', fn: genConsolidatedUnrealized }
  ];

  function levelLabel(l) { return l === '3' ? '3級' : (l === '2' ? '2級' : '1級'); }

  // 出題関数から論点名(TOPICS の label)を求める(結果発表の論点別成績に使用)
  function topicLabelOfFn(fn) {
    const t = PROBLEM_TYPES.find(function (x) { return x.fn === fn; });
    const topic = t ? TOPICS.find(function (x) { return x.id === t.topic; }) : null;
    return topic ? topic.label : '';
  }

  // 「この問題を報告する」リンク:問題文と正答を入力済みの状態でお問い合わせフォームを開く
  const REPORT_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScCEm_oxqjb2fnk4E5-ko0RU8uBDGzriEG1r4G6XmYSlHN_Rw/viewform';
  const REPORT_FORM_ENTRY = 'entry.670715906'; // 「お問い合わせ内容を記入してください。」の欄
  const REPORT_QUESTION_MAX = 800;
  function htmlToReportText(html) {
    return html
      .replace(/<table/g, '\n<table').replace(/<\/(tr|div|p|caption|table)>/g, '\n').replace(/<br\s*\/?>/g, '\n')
      .replace(/<\/(td|th)>/g, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      .replace(/[ \t]+\n/g, '\n').replace(/\n{2,}/g, '\n').trim();
  }
  // Googleフォームは URL が約8,000文字を超えると開けないため、超える場合は解説の後ろを省略する
  const REPORT_URL_MAX = 7800;
  function reportLinkHTML(tag, questionHtml, answer, userAnswer, explainHtml) {
    let q = htmlToReportText(questionHtml);
    if (q.length > REPORT_QUESTION_MAX) q = q.slice(0, REPORT_QUESTION_MAX) + '…(以下略)';
    const head = '【報告内容】\n\n\n' +
      '【報告する問題】\n' + tag + '\n' + q + '\n' +
      'サイトの正答：' + yen(answer) + '\n' +
      'あなたの解答：' + (userAnswer === null ? '未回答' : yen(userAnswer)) + '\n\n' +
      '【解説】\n';
    const base = REPORT_FORM_URL + '?usp=pp_url&amp;' + REPORT_FORM_ENTRY + '=';
    const enc = function (s) { return encodeURIComponent(s).replace(/'/g, '%27'); };
    let ex = htmlToReportText(explainHtml || '');
    let url = base + enc(head + ex);
    while (url.length > REPORT_URL_MAX && ex.length > 0) {
      ex = ex.slice(0, Math.max(0, ex.length - 20));
      url = base + enc(head + ex + '…(以下略)');
    }
    return '<a class="report-link" href="' + url + '" target="_blank" rel="noopener noreferrer">' +
      '<span class="report-icon" aria-hidden="true">error</span><span class="report-text">この問題を報告する</span></a>';
  }

  let currentTypeFn = null;

  const TYPE_WEIGHTS = { aro: 0.35 };
  function weightedPick(list) {
    const weights = list.map(function (t) {
      if (t.weight !== undefined) return t.weight;
      return TYPE_WEIGHTS[t.topic] !== undefined ? TYPE_WEIGHTS[t.topic] : 1;
    });
    const total = weights.reduce(function (a, b) { return a + b; }, 0);
    let r = Math.random() * total;
    for (let i = 0; i < list.length; i++) {
      r -= weights[i];
      if (r <= 0) return list[i];
    }
    return list[list.length - 1];
  }

  // 固定資産の取得原価(取得原価が問題文に出ない問題は帳簿価額・時価)を50万円以上にする
  const MIN_ASSET_AMOUNT = 500000;
  function minAssetAmount(p) {
    if (p.assetCost !== undefined) return p.assetCost;
    if (/のれん|繰延資産|ソフトウェア|自家建設/.test(p.category)) return Infinity;
    const qh = p.question;
    const q = qh.replace(/<[^>]+>/g, ' ');
    const vals = [];
    const costRe = /(取得原価|取得価額|購入価額は|見積現金購入価額は)\s*(¥[\d,]+)|(¥[\d,]+)の新|建物付土地を(¥[\d,]+)/g;
    let m;
    while ((m = costRe.exec(q)) !== null) vals.push(+(m[2] || m[3] || m[4]).replace(/[¥,]/g, ''));
    const table = qh.match(/<table[\s\S]*?<\/table>/);
    if (table && /総合償却/.test(p.category)) {
      const re2 = /<tr>\s*<td[^>]*>[^<]*<\/td>\s*<td[^>]*>(¥[\d,]+)<\/td>/g;
      let r;
      while ((r = re2.exec(table[0])) !== null) vals.push(+r[1].replace(/[¥,]/g, ''));
    }
    if (!vals.length) {
      const bvRe = /(帳簿価額|時価)\s*(¥[\d,]+)/g;
      while ((m = bvRe.exec(q)) !== null) vals.push(+m[2].replace(/[¥,]/g, ''));
    }
    return vals.length ? Math.min.apply(null, vals) : Infinity;
  }
  function generateWithMinAmount(fn) {
    let p;
    for (let i = 0; i < 300; i++) {
      p = fn();
      if (minAssetAmount(p) >= MIN_ASSET_AMOUNT) return p;
    }
    return p;
  }

  // 1回の出題(1問ずつ・まとめて出題・印刷用ページ)の中で、同じ答え・同じ金額の問題を出さないための記録
  let sessionUsed = { answers: new Set(), amounts: new Set() };
  function resetSessionUsed() { sessionUsed = { answers: new Set(), amounts: new Set() }; }
  function problemKeys(p) {
    const m = p.question.replace(/<[^>]+>/g, '').match(/¥[\d,]+/);
    return { ans: p.answer !== 0 ? p.answer : null, amt: (m && m[0] !== '¥0') ? m[0] : null };
  }
  function makeProblem() {
    let p, k, tries = 0;
    do {
      p = makeProblemOnce();
      k = problemKeys(p);
      tries++;
    } while (((k.ans !== null && sessionUsed.answers.has(k.ans)) || (k.amt !== null && sessionUsed.amounts.has(k.amt))) && tries < 60);
    if (k.ans !== null) sessionUsed.answers.add(k.ans);
    if (k.amt !== null) sessionUsed.amounts.add(k.amt);
    return p;
  }
  function makeProblemOnce() {
    CURRENT_FY = randInt(11, 15);
    FY_START_MONTH = Math.random() < 0.7 ? 4 : 1;
    if (state.retryQueue) {
      const fn = state.retryQueue[state.qNo - 1];
      currentTypeFn = fn;
      return generateWithMinAmount(fn);
    }
    let pool;
    if (state.customMode) {
      const allCombos = [];
      TOPICS.forEach(function (t) { t.levels.forEach(function (lv) { allCombos.push(t.id + '_' + lv); }); });
      const combos = state.selectedTopics && state.selectedTopics.length ? state.selectedTopics : allCombos;
      pool = PROBLEM_TYPES.filter(function (t) { return combos.includes(t.topic + '_' + t.level); });
    } else {
      const levels = state.selectedLevels && state.selectedLevels.length ? state.selectedLevels : ['3', '2', '1'];
      pool = PROBLEM_TYPES.filter(function (t) { return levels.includes(t.level); });
    }
    const list = pool.length ? pool : PROBLEM_TYPES;
    const chosen = weightedPick(list);
    currentTypeFn = chosen.fn;
    return generateWithMinAmount(chosen.fn);
  }

  const quizHeader = document.getElementById('quizHeader');
  const startPanel = document.getElementById('startPanel');
  const depreWrapEl = document.querySelector('.depre-wrap');
  const qNumberEl = document.getElementById('qNumber');
  const qTotalEl = document.getElementById('qTotal');
  const typeTagEl = document.getElementById('typeTag');
  const questionEl = document.getElementById('questionText');
  const answerInput = document.getElementById('answerInput');
  const gradeBtn = document.getElementById('gradeBtn');
  const nextBtn = document.getElementById('nextBtn');
  const quitBtn = document.getElementById('quitBtn');
  const feedbackEl = document.getElementById('feedback');
  const verdictBadge = document.getElementById('verdictBadge');
  const verdictText = document.getElementById('verdictText');
  const verdictSub = document.getElementById('verdictSub');
  const correctionEl = document.getElementById('correction');
  const explainBody = document.getElementById('explainBody');
  const reportRow = document.getElementById('reportRow');
  const correctCountEl = document.getElementById('correctCount');
  const totalCountEl = document.getElementById('totalCount');
  const problemCard = document.getElementById('problemCard');
  const resultsPanel = document.getElementById('resultsPanel');
  const startBtn = document.getElementById('startBtn');
  const printBtn = document.getElementById('printBtn');
  const printQuestionsPanel = document.getElementById('printQuestionsPanel');
  const printAnswersPanel = document.getElementById('printAnswersPanel');
  const printQuestionsSheet = document.getElementById('printQuestionsSheet');
  const printAnswersSheet = document.getElementById('printAnswersSheet');


  const batchCard = document.getElementById('batchCard');
  const batchList = document.getElementById('batchList');
  const batchGradeBtn = document.getElementById('batchGradeBtn');
  const questionCountRange = document.getElementById('questionCountRange');
  const questionCountValue = document.getElementById('questionCountValue');
  const batchModeCheck = document.getElementById('batchModeCheck');
  const hideLevelCheck = document.getElementById('hideLevelCheck');

  function getQuestionCount() {
    const n = parseInt(questionCountRange.value, 10);
    return isNaN(n) ? 10 : Math.min(20, Math.max(1, n));
  }
  function updateQuestionCountDisplay() {
    const n = getQuestionCount();
    questionCountValue.textContent = n;
    const pct = (n - 1) / 19 * 100;
    questionCountRange.style.background = 'linear-gradient(to right, var(--range-fill) 0%, var(--range-fill) ' + pct + '%, var(--range-track) ' + pct + '%, var(--range-track) 100%)';
  }
  const optionPanel = document.getElementById('optionPanel');
  const optionToggle = document.getElementById('optionToggle');
  const optionSummary = document.getElementById('optionSummary');
  function updateOptionSummary() {
    optionSummary.textContent = getQuestionCount() + '問／' +
      (batchModeCheck.checked ? 'まとめて' : '1問ずつ') + '／' +
      (hideLevelCheck.checked ? '級非表示' : '級表示');
  }
  optionToggle.addEventListener('click', function () {
    const isOpen = optionPanel.classList.toggle('open');
    optionToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  questionCountRange.addEventListener('input', function () { updateQuestionCountDisplay(); updateOptionSummary(); });
  batchModeCheck.addEventListener('change', updateOptionSummary);
  hideLevelCheck.addEventListener('change', updateOptionSummary);
  updateQuestionCountDisplay();
  updateOptionSummary();

  let SESSION_MAX = 10;
  let state = { correct: 0, total: 0, streak: 0, qNo: 0, problem: null, graded: false, history: [], selectedLevels: ['3', '2', '1'], customMode: false, selectedTopics: [], retryQueue: null };

  function loadProblem(advance) {
    if (advance) state.qNo += 1;
    if (state.qNo === 1) resetSessionUsed();
    quizHeader.classList.remove('is-batch');
    state.problem = makeProblem();
    state.graded = false;

    qNumberEl.textContent = state.qNo;
    qTotalEl.textContent = SESSION_MAX;
    typeTagEl.textContent = levelLabel(state.problem.level);
    typeTagEl.className = 'type-tag lv-' + state.problem.level;
    typeTagEl.style.display = state.hideLevel ? 'none' : '';
    typeTagEl.classList.remove('tag-reveal');
    questionEl.innerHTML = state.problem.question;

    answerInput.value = '';
    answerInput.disabled = false;
    gradeBtn.disabled = false;
    gradeBtn.style.display = '';
    feedbackEl.classList.add('no-anim');
    feedbackEl.classList.remove('show');
    void feedbackEl.offsetWidth;
    feedbackEl.classList.remove('no-anim');
    nextBtn.style.display = 'none';
    quitBtn.style.display = 'none';
    correctionEl.style.display = 'none';

    answerInput.focus();
  }

  function grade() {
    if (state.graded) return;
    const raw = answerInput.value.replace(/[,、円\s]/g, '');
    const val = parseInt(raw, 10);
    const p = state.problem;
    const userAnswer = isNaN(val) ? null : val;
    const isCorrect = userAnswer !== null && userAnswer === p.answer;

    state.graded = true;
    state.total += 1;
    if (state.hideLevel) {
      typeTagEl.classList.remove('tag-reveal');
      typeTagEl.style.display = '';
      void typeTagEl.offsetWidth;
      typeTagEl.classList.add('tag-reveal');
    } else {
      typeTagEl.style.display = '';
    }
    state.history.push({
      qNo: state.qNo,
      tag: levelLabel(p.level) + '・' + p.category,
      question: p.question,
      answer: p.answer,
      userAnswer: userAnswer,
      ok: isCorrect,
      explain: p.explain,
      genFn: currentTypeFn,
      topic: topicLabelOfFn(currentTypeFn)
    });

    if (isCorrect) { state.correct += 1; state.streak += 1; } else { state.streak = 0; }

    correctCountEl.textContent = state.correct;
    totalCountEl.textContent = state.total;

    verdictBadge.classList.remove('correct', 'wrong');
    verdictBadge.style.animation = 'none';
    void verdictBadge.offsetWidth;
    verdictBadge.style.animation = '';

    if (isCorrect) {
      verdictBadge.textContent = '○';
      verdictBadge.classList.add('correct');
      verdictText.textContent = '正解！';
      verdictText.className = 'verdict-text correct';
      verdictSub.textContent = state.streak >= 2 ? (state.streak + '問連続正解！') : pick(['よくできました。', 'いい調子です。', 'その調子。']);
      correctionEl.style.display = 'none';
    } else {
      verdictBadge.textContent = '✕';
      verdictBadge.classList.add('wrong');
      verdictText.textContent = '不正解';
      verdictText.className = 'verdict-text wrong';
      verdictSub.textContent = '下の解説で計算を確認しましょう。';
      correctionEl.style.display = 'inline-block';
      correctionEl.textContent = '正しい答え: ' + yen(p.answer);
    }

    explainBody.innerHTML = p.explain;
    reportRow.innerHTML = reportLinkHTML(levelLabel(p.level) + '・' + p.category, p.question, p.answer, userAnswer, p.explain);
    feedbackEl.classList.add('show');
    requestAnimationFrame(function () { setTimeout(function () { checkTableScrollHints(explainBody); }, 350); });

    const gradeScrollStartY = window.scrollY;
    const gradeScrollTargetY = gradeBtn.getBoundingClientRect().top + window.scrollY;
    const gradeScrollStartTime = performance.now();
    const gradeScrollDuration = 500;
    function gradeScrollEasing(t) { return scrollEasing(t); }
    function animateGradeScroll(now) {
      const elapsed = now - gradeScrollStartTime;
      const t = Math.min(1, elapsed / gradeScrollDuration);
      const eased = gradeScrollEasing(t);
      const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
      const idealY = gradeScrollStartY + (gradeScrollTargetY - gradeScrollStartY) * eased;
      window.scrollTo(0, Math.max(0, Math.min(idealY, maxScrollY)));
      if (t < 1) {
        requestAnimationFrame(animateGradeScroll);
      }
    }
    requestAnimationFrame(animateGradeScroll);

    answerInput.disabled = true;
    gradeBtn.disabled = true;
    nextBtn.disabled = false;
    nextBtn.textContent = state.qNo >= SESSION_MAX ? '結果を見る' : '次の問題へ →';
    nextBtn.style.display = '';
    quitBtn.disabled = false;
    quitBtn.style.display = state.qNo >= SESSION_MAX ? 'none' : '';
    nextBtn.focus();
  }

  function renderBatch() {
    state.batchItems = [];
    resetSessionUsed();
    let html = '';
    for (let i = 1; i <= SESSION_MAX; i++) {
      state.qNo = i;
      const p = makeProblem();
      state.batchItems.push({ problem: p, genFn: currentTypeFn });
      html += '<div class="batch-item">' +
        '<div class="depre-qno">第<span>' + i + '</span>問' +
        (state.hideLevel ? '' : '<span class="type-tag lv-' + p.level + '">' + levelLabel(p.level) + '</span>') + '</div>' +
        '<div class="depre-question">' + p.question + '</div>' +
        '<div class="depre-answer-row">' +
        '<input type="text" inputmode="numeric" class="depre-input batch-input" data-index="' + (i - 1) + '" placeholder="" autocomplete="off" aria-label="第' + i + '問の解答" />' +
        '<span class="depre-yen">円</span>' +
        '</div>' +
        '</div>';
    }
    batchList.innerHTML = html;
    document.getElementById('batchTotalCount').textContent = SESSION_MAX;
    quizHeader.classList.add('is-batch');
    batchGradeBtn.disabled = false;
    const inputs = batchList.querySelectorAll('.batch-input');
    inputs.forEach(function (input, idx) {
      input.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' || e.isComposing) return;
        e.preventDefault();
        if (idx + 1 < inputs.length) inputs[idx + 1].focus();
        else batchGradeBtn.focus();
      });
    });
  }

  function gradeBatch() {
    const inputs = batchList.querySelectorAll('.batch-input');
    state.batchItems.forEach(function (item, idx) {
      const p = item.problem;
      const raw = (inputs[idx] ? inputs[idx].value : '').replace(/[,、円\s]/g, '');
      const val = parseInt(raw, 10);
      const userAnswer = isNaN(val) ? null : val;
      const isCorrect = userAnswer !== null && userAnswer === p.answer;
      state.total += 1;
      if (isCorrect) state.correct += 1;
      state.history.push({
        qNo: idx + 1,
        tag: levelLabel(p.level) + '・' + p.category,
        question: p.question,
        answer: p.answer,
        userAnswer: userAnswer,
        ok: isCorrect,
        explain: p.explain,
        genFn: item.genFn,
        topic: topicLabelOfFn(item.genFn)
      });
    });
    correctCountEl.textContent = state.correct;
    totalCountEl.textContent = state.total;
  }

  batchGradeBtn.addEventListener('click', function (evt) {
    if (batchGradeBtn.disabled) return;
    batchGradeBtn.disabled = true;
    if (evt.detail === 0) {
      const r = batchGradeBtn.getBoundingClientRect();
      spawnSparkles(r.left + r.width / 2, r.top + r.height / 2);
    } else {
      spawnSparkles(evt.clientX, evt.clientY);
    }
    gradeBatch();
    batchCard.classList.add('fade-out');
    setTimeout(function () {
      batchCard.classList.remove('fade-out');
      window.scrollTo(0, 0);
      showResults();
      resultsPanel.classList.add('fade-in');
      setTimeout(function () { resultsPanel.classList.remove('fade-in'); }, 500);
    }, 380);
  });

  function showResults() {
    problemCard.style.display = 'none';
    batchCard.style.display = 'none';
    quizHeader.classList.remove('is-batch');
    const wrongCount = state.history.filter(function (h) { return !h.ok; }).length;

    let html = '<div class="results-score">' + state.correct + ' / ' + state.total + ' 問正解</div>';
    html += '<div class="results-sub">正答率 ' + Math.round((state.correct / state.total) * 100) + '%</div>';

    html += '<div class="result-grid">';
    state.history.forEach(function (h) {
      html += '<div class="result-cell ' + (h.ok ? 'ok' : 'ng') + '">' +
        '<span class="result-qno">問' + h.qNo + '</span>' +
        '<span class="result-mark">' + (h.ok ? '○' : '✕') + '</div>';
    });
    html += '</div>';

    html += '<div class="btn-row">';
    if (wrongCount > 0) html += '<button class="depre-btn secondary" id="reviewBtn">間違えた問題を復習する</button>';
    html += '<button class="depre-btn yellow" id="topBtn">トップページへ</button>';
    html += '<button class="depre-btn pink" id="shareBtn">Xにシェアする</button>';
    html += '</div>';

    if (wrongCount === 0) {
      html += '<div class="results-sub" style="margin-top:16px;">全問正解でした。素晴らしい出来です。</div>';
    } else if (state.total > 0 && state.correct / state.total >= 0.8) {
      html += '<div class="results-sub" style="margin-top:16px;">高い正答率です。間違えた問題を復習して全問正解を目指しましょう。</div>';
    }

    // 論点別の成績(2論点以上出題されたときのみ表示)
    const topicStats = [];
    state.history.forEach(function (h) {
      if (!h.topic) return;
      let s = topicStats.find(function (x) { return x.label === h.topic; });
      if (!s) { s = { label: h.topic, ok: 0, total: 0 }; topicStats.push(s); }
      s.total += 1;
      if (h.ok) s.ok += 1;
    });
    if (topicStats.length >= 2) {
      const topicOrder = TOPICS.map(function (t) { return t.label; });
      topicStats.sort(function (a, b) { return topicOrder.indexOf(a.label) - topicOrder.indexOf(b.label); });
      html += '<div class="topic-stats"><div class="topic-stats-title">論点別の成績</div><div class="topic-stats-grid">';
      topicStats.forEach(function (s) {
        const cls = s.ok === s.total ? 'ok' : (s.ok === 0 ? 'ng' : 'part');
        html += '<div class="topic-stat ' + cls + '"><span class="topic-stat-name">' + s.label + '</span>' +
          '<span class="topic-stat-num">' + s.ok + ' / ' + s.total + '</span></div>';
      });
      html += '</div></div>';
    }

    html += '<div class="review-section show">';
    state.history.forEach(function (h) {
      const yourAnswerText = h.userAnswer === null ? '未回答' : yen(h.userAnswer);
      const compareRow = h.ok
        ? '<div class="answer-row-compare"><span class="your-answer-badge ok">あなたの解答: ' + yourAnswerText + '</div>'
        : '<div class="answer-row-compare"><span class="correct-answer-badge">正しい答え: ' + yen(h.answer) + '</span><span class="your-answer-badge ng">あなたの解答: ' + yourAnswerText + '</div>';
      html += '<div class="review-item">' +
        '<span class="review-tag ' + (h.ok ? 'ok' : 'ng') + '">第' + h.qNo + '問・' + h.tag + '</span>' +
        '<div class="review-q">' + h.question + '</div>' +
        compareRow +
        '<div class="depre-explain">' + h.explain + '</div>' +
        '<div class="report-row">' + reportLinkHTML(h.tag, h.question, h.answer, h.userAnswer, h.explain) + '</div>' +
        '</div>';
    });
    html += '</div>';

    resultsPanel.innerHTML = html;
    resultsPanel.style.display = '';
    requestAnimationFrame(function () { setTimeout(function () { checkTableScrollHints(resultsPanel); }, 350); });

    const reviewBtn = document.getElementById('reviewBtn');
    if (reviewBtn) {
      reviewBtn.addEventListener('click', function () {
        if (reviewBtn.disabled) return;
        reviewBtn.disabled = true;
        resultsPanel.classList.add('fade-out');
        setTimeout(function () {
          resultsPanel.classList.remove('fade-out');
          window.scrollTo(0, 0);
          retryWrongOnly();
          const retryCard = state.batchMode ? batchCard : problemCard;
          retryCard.classList.add('fade-in');
          setTimeout(function () { retryCard.classList.remove('fade-in'); }, 500);
        }, 380);
      });
    }
    const topBtn = document.getElementById('topBtn');
    topBtn.addEventListener('click', function () {
      if (topBtn.disabled) return;
      topBtn.disabled = true;
      resultsPanel.classList.add('fade-out');
      setTimeout(function () {
        resultsPanel.classList.remove('fade-out');
        window.scrollTo(0, 0);
        restartToStart();
        startPanel.classList.add('fade-in');
        setTimeout(function () { startPanel.classList.remove('fade-in'); }, 500);
      }, 380);
    });
    document.getElementById('shareBtn').addEventListener('click', function () {
      function getLevelLabel(level) { return level === '3' ? '3級' : (level === '2' ? '2級' : '1級'); }
      let difficultyText, hashLevel;
      if (state.customMode) {
        const combos = state.selectedTopics && state.selectedTopics.length ? state.selectedTopics : getSelectedTopicCombos();
        const entries = combos.map(function (combo) {
          const idx = combo.lastIndexOf('_');
          const topicId = combo.slice(0, idx);
          const lv = combo.slice(idx + 1);
          const topic = TOPICS.find(function (t) { return t.id === topicId; });
          return topic ? { topicId: topicId, label: topic.label, level: lv } : null;
        }).filter(Boolean);

        let highestLevel = '3';
        for (let i = 0; i < ['1', '2', '3'].length; i++) {
          const lv = ['1', '2', '3'][i];
          if (entries.some(function (e) { return e.level === lv; })) { highestLevel = lv; break; }
        }
        hashLevel = getLevelLabel(highestLevel);

        if (entries.length >= 6) {
          const levelsUsed = [];
          ['3', '2', '1'].forEach(function (lv) {
            if (entries.some(function (e) { return e.level === lv; }) && levelsUsed.indexOf(lv) === -1) levelsUsed.push(lv);
          });
          difficultyText = 'CUSTOM(' + levelsUsed.map(getLevelLabel).join('、') + ')';
        } else {
          const groups = {};
          entries.forEach(function (e) { (groups[e.level] = groups[e.level] || []).push(e); });
          const parts = [];
          ['3', '2', '1'].forEach(function (lv) {
            if (groups[lv]) {
              const allTopicIdsForLevel = TOPICS.filter(function (t) { return t.levels.indexOf(lv) !== -1; }).map(function (t) { return t.id; });
              const selectedIds = groups[lv].map(function (e) { return e.topicId; });
              const isFullSet = selectedIds.length === allTopicIdsForLevel.length && allTopicIdsForLevel.every(function (id) { return selectedIds.indexOf(id) !== -1; });
              if (isFullSet) {
                parts.push(getLevelLabel(lv));
              } else {
                parts.push(getLevelLabel(lv) + '：' + groups[lv].map(function (e) { return e.label; }).join('、'));
              }
            }
          });
          difficultyText = 'CUSTOM(' + parts.join('、') + ')';
        }
      } else {
        const levels = state.selectedLevels || ['3', '2', '1'];
        let diffName, hLevel;
        if (levels.length === 1) { diffName = 'EASY'; hLevel = '3'; }
        else if (levels.length === 2) { diffName = 'NORMAL'; hLevel = '2'; }
        else { diffName = 'HARD'; hLevel = '1'; }
        difficultyText = diffName;
        hashLevel = getLevelLabel(hLevel);
      }
      const text = '減価償却ドリル 難易度' + difficultyText + 'で' + state.total + '問中' + state.correct + '問正解しました！ #簿記検定 #簿記' + hashLevel + ' #減価償却';
      const url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
      window.open(url, '_blank', 'noopener');
    });
  }

  function retryWrongOnly() {
    const queue = state.history.filter(function (h) { return !h.ok; }).map(function (h) { return h.genFn; });
    if (queue.length === 0) return;
    SESSION_MAX = queue.length;
    const prevBatchMode = state.batchMode, prevHideLevel = state.hideLevel;
    state = { correct: 0, total: 0, streak: 0, qNo: 0, problem: null, graded: false, history: [], selectedLevels: state.selectedLevels, customMode: state.customMode, selectedTopics: state.selectedTopics, retryQueue: queue };
    correctCountEl.textContent = '0';
    totalCountEl.textContent = '0';
    state.batchMode = prevBatchMode;
    state.hideLevel = prevHideLevel;
    resultsPanel.style.display = 'none';
    resultsPanel.innerHTML = '';
    quizHeader.style.display = '';
    if (state.batchMode) {
      batchCard.style.display = '';
      renderBatch();
    } else {
      problemCard.style.display = '';
      loadProblem(true);
    }
  }

  function restartToStart() {
    CURRENT_FY = randInt(11, 15);
    FY_START_MONTH = Math.random() < 0.7 ? 4 : 1;
    SESSION_MAX = getQuestionCount();
    state = { correct: 0, total: 0, streak: 0, qNo: 0, problem: null, graded: false, history: [], selectedLevels: ['3', '2', '1'], customMode: false, selectedTopics: [], retryQueue: null };
    correctCountEl.textContent = '0';
    totalCountEl.textContent = '0';
    resultsPanel.style.display = 'none';
    resultsPanel.innerHTML = '';
    problemCard.style.display = 'none';
    batchCard.style.display = 'none';
    quizHeader.style.display = 'none';
    quizHeader.classList.remove('is-batch');
    startPanel.style.display = '';
    document.querySelectorAll('.diff-check').forEach(function (cb) { cb.checked = false; });
    refreshDiffCards();
  }

  const depreAppEl = document.querySelector('.depre-app');
  const darkModeCheckbox = document.getElementById('darkModeCheckbox');
  function applyDarkMode(isDark) {
    depreAppEl.classList.toggle('dark-mode', isDark);
    document.documentElement.classList.toggle('dark-bg', isDark);
    darkModeCheckbox.checked = isDark;
  }
  let savedDarkMode = false;
  try { savedDarkMode = localStorage.getItem('depreDarkMode') === '1'; } catch (e) {}
  applyDarkMode(savedDarkMode);
  darkModeCheckbox.addEventListener('change', function () {
    applyDarkMode(darkModeCheckbox.checked);
    try { localStorage.setItem('depreDarkMode', darkModeCheckbox.checked ? '1' : '0'); } catch (e) {}
  });

  gradeBtn.addEventListener('click', grade);
  let headerTitleNavigating = false;
  document.getElementById('headerTitle').addEventListener('click', function () {
    if (headerTitleNavigating) return;
    headerTitleNavigating = true;
    const visible = problemCard.style.display !== 'none' ? problemCard : (batchCard.style.display !== 'none' ? batchCard : resultsPanel);
    visible.classList.add('fade-out');
    quizHeader.classList.add('fade-out');
    setTimeout(function () {
      visible.classList.remove('fade-out');
      quizHeader.classList.remove('fade-out');
      window.scrollTo(0, 0);
      restartToStart();
      startPanel.classList.add('fade-in');
      headerTitleNavigating = false;
      setTimeout(function () { startPanel.classList.remove('fade-in'); }, 500);
    }, 380);
  });
  quitBtn.addEventListener('click', function () {
    if (quitBtn.disabled || nextBtn.disabled) return;
    quitBtn.disabled = true;
    nextBtn.disabled = true;
    problemCard.classList.add('fade-out');
    setTimeout(function () {
      problemCard.classList.remove('fade-out');
      window.scrollTo(0, 0);
      showResults();
      resultsPanel.classList.add('fade-in');
      setTimeout(function () { resultsPanel.classList.remove('fade-in'); }, 500);
    }, 380);
  });
  nextBtn.addEventListener('click', function () {
    if (nextBtn.disabled) return;
    nextBtn.disabled = true;
    quitBtn.disabled = true;
    if (state.qNo >= SESSION_MAX) {
      problemCard.classList.add('fade-out');
      setTimeout(function () {
        problemCard.classList.remove('fade-out');
        window.scrollTo(0, 0);
        showResults();
        resultsPanel.classList.add('fade-in');
        setTimeout(function () { resultsPanel.classList.remove('fade-in'); }, 500);
      }, 380);
      return;
    }
    problemCard.classList.add('fade-out');
    setTimeout(function () {
      problemCard.classList.remove('fade-out');
      window.scrollTo(0, 0);
      loadProblem(true);
      problemCard.classList.add('fade-in');
      setTimeout(function () { problemCard.classList.remove('fade-in'); }, 500);
    }, 380);
  });
  answerInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); grade(); }
  });

  const customPanel = document.getElementById('customPanel');
  customPanel.innerHTML =
    ['3', '2', '1'].map(function (lv) {
      const topicsForLevel = TOPICS.filter(function (t) { return t.levels.includes(lv); });
      if (topicsForLevel.length === 0) return '';
      return '<div class="custom-level-heading"><label class="custom-level-checkbox"><input type="checkbox" class="custom-level-check" data-level="' + lv + '"><span class="cute-box-sm"></span></label><span class="heading-text">' + levelLabel(lv) + '</div>' +
        '<div class="custom-level-group">' +
        topicsForLevel.map(function (t) {
          const combo = t.id + '_' + lv;
          return '<label class="custom-row"><input type="checkbox" class="custom-topic" value="' + combo + '"><span class="cute-box"></span><span>' + t.label + '</span></label>';
        }).join('') +
        '</div>';
    }).join('');

  function levelsForDifficulty(diff) {
    if (diff === 'easy') return ['3'];
    if (diff === 'normal') return ['3', '2'];
    return ['3', '2', '1'];
  }

  function getSelectedTopicCombos() {
    return Array.from(document.querySelectorAll('.custom-topic:checked')).map(function (el) { return el.value; });
  }

  function syncLevelCheckboxes() {
    document.querySelectorAll('.custom-level-check').forEach(function (levelCb) {
      const lv = levelCb.getAttribute('data-level');
      const topics = document.querySelectorAll('.custom-topic[value$="_' + lv + '"]');
      if (topics.length === 0) return;
      const checkedCount = Array.from(topics).filter(function (cb) { return cb.checked; }).length;
      levelCb.checked = checkedCount > 0;
      levelCb.indeterminate = checkedCount > 0 && checkedCount < topics.length;
    });
  }

  function refreshDiffCards() {
    document.querySelectorAll('.diff-card').forEach(function (card) {
      card.classList.toggle('active', card.querySelector('input').checked);
    });
    const checkedInput = document.querySelector('.diff-check:checked');
    const isCustom = checkedInput && checkedInput.value === 'custom';
    customPanel.classList.toggle('show', isCustom);
    syncLevelCheckboxes();
    const anyTopicChecked = getSelectedTopicCombos().length > 0;
    startBtn.disabled = !checkedInput || (isCustom && !anyTopicChecked);
    printBtn.disabled = startBtn.disabled;
  }
  refreshDiffCards();

  document.querySelectorAll('.diff-card').forEach(function (card) {
    const input = card.querySelector('input');
    card.addEventListener('click', function (e) {
      e.preventDefault();
      const wasChecked = input.checked;
      const wasCustomOpen = customPanel.classList.contains('show');
      document.querySelectorAll('.diff-check').forEach(function (cb) { cb.checked = false; });
      if (!wasChecked) input.checked = true;
      refreshDiffCards();
      const isCustomOpenNow = customPanel.classList.contains('show');
      if (isCustomOpenNow && !wasCustomOpen) {
        const customIcon = document.querySelector('.diff-card[data-diff="custom"] .diff-emoji');
        const startScrollY = window.scrollY;
        const targetScrollY = customIcon.getBoundingClientRect().bottom + window.scrollY;
        const scrollStartTime = performance.now();
        const scrollDuration = 500;
        function panelEasing(t) { return scrollEasing(t); }
        function animateScroll(now) {
          const elapsed = now - scrollStartTime;
          const t = Math.min(1, elapsed / scrollDuration);
          const eased = panelEasing(t);
          const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
          const idealY = startScrollY + (targetScrollY - startScrollY) * eased;
          window.scrollTo(0, Math.max(0, Math.min(idealY, maxScrollY)));
          if (t < 1) {
            requestAnimationFrame(animateScroll);
          }
        }
        requestAnimationFrame(animateScroll);
      } else if (!isCustomOpenNow && wasCustomOpen) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  document.querySelectorAll('.custom-topic').forEach(function (input) {
    input.addEventListener('change', refreshDiffCards);
  });
  document.querySelectorAll('.custom-level-check').forEach(function (input) {
    input.addEventListener('change', function () {
      const lv = input.getAttribute('data-level');
      document.querySelectorAll('.custom-topic[value$="_' + lv + '"]').forEach(function (cb) { cb.checked = input.checked; });
      input.indeterminate = false;
      refreshDiffCards();
    });
  });

  function spawnSparkles(cx, cy) {
    const SHAPES = [
      { viewBox: '0 0 41 40', markup: '<polygon points="21,0 28.053423027509677,11.29179606750063 40.97218684219823,14.510643118126104 32.412678195541844,24.70820393249937 33.34349029814194,37.989356881873896 21,33 8.656509701858067,37.989356881873896 9.587321804458158,24.70820393249937 1.0278131578017735,14.510643118126108 13.94657697249032,11.291796067500632"></polygon>' },
      { viewBox: '0 0 36 36', markup: '<polygon points="18,0 22.242640687119284,13.757359312880714 36,18 22.242640687119284,22.242640687119284 18.000000000000004,36 13.757359312880716,22.242640687119284 0,18.000000000000004 13.757359312880714,13.757359312880716"></polygon>' },
      { viewBox: '0 0 36 36', markup: '<polygon points="18,0 27.192388155425117,8.80761184457488 36,18 27.19238815542512,27.192388155425117 18.000000000000004,36 8.807611844574883,27.19238815542512 0,18.000000000000004 8.80761184457488,8.807611844574884"></polygon>' },
      { viewBox: '0 0 36 36', markup: '<circle cx="18" cy="18" r="17"></circle>' }
    ];
    const colors = ['#FFD54A', '#FFB627', '#FF9F45', '#FFC978', '#FFD54A', '#FFB627', '#FFFFFF', '#FFFFFF', '#2EC4B6'];
    const count = randInt(16, 24);
    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'spark-particle';
      const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const sizeRoll = Math.random();
      const size = sizeRoll < 0.6 ? (6 + Math.random() * 5) : (28 + Math.random() * 26);
      el.innerHTML = '<svg viewBox="' + shape.viewBox + '" width="' + size + '" height="' + size + '" fill="' + color + '">' + shape.markup + '</svg>';
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 130;
      el.style.left = cx + 'px';
      el.style.top = cy + 'px';
      el.style.setProperty('--dx', (Math.cos(angle) * dist) + 'px');
      el.style.setProperty('--dy', (Math.sin(angle) * dist) + 'px');
      document.body.appendChild(el);
      setTimeout(function () { el.remove(); }, 800);
    }
  }

  startBtn.addEventListener('click', function (evt) {
    if (startBtn.disabled) return;
    startBtn.disabled = true;
    const checked = document.querySelector('.diff-check:checked');
    const diff = checked ? checked.value : 'hard';
    if (diff === 'custom') {
      state.customMode = true;
      state.selectedTopics = getSelectedTopicCombos();
    } else {
      state.customMode = false;
      state.selectedLevels = levelsForDifficulty(diff);
    }
    SESSION_MAX = getQuestionCount();
    state.batchMode = batchModeCheck.checked;
    state.hideLevel = hideLevelCheck.checked;

    spawnSparkles(evt.clientX, evt.clientY);
    startPanel.classList.add('fade-out');
    setTimeout(function () {
      startPanel.style.display = 'none';
      startPanel.classList.remove('fade-out');
      window.scrollTo(0, 0);
      const activeCard = state.batchMode ? batchCard : problemCard;
      quizHeader.style.display = '';
      activeCard.style.display = '';
      quizHeader.classList.add('fade-in');
      activeCard.classList.add('fade-in');
      if (state.batchMode) renderBatch(); else loadProblem(true);
      setTimeout(function () {
        quizHeader.classList.remove('fade-in');
        activeCard.classList.remove('fade-in');
      }, 500);
    }, 380);
  });

  let printProblems = [];
  let printHideLevel = false;

  function buildPrintQuestionsHTML() {
    let html = '<div class="print-sheet-header">' +
      '<div class="print-sheet-title">減価償却ドリル - 問題用紙</div>' +
      '<div class="print-sheet-meta">全' + printProblems.length + '問</div>' +
      '</div>';
    printProblems.forEach(function (p, idx) {
      html += '<div class="print-q-item">' +
        '<div class="print-q-number">第' + (idx + 1) + '問' + (printHideLevel ? '' : ' <span class="print-type-tag">' + levelLabel(p.level) + '</span>') + '</div>' +
        '<div class="print-q-text">' + p.question + '</div>' +
        '<div class="print-answer-line">解答：<span class="print-answer-blank"></span> 円</div>' +
        '</div>';
    });
    return html;
  }

  function buildPrintAnswersHTML() {
    let html = '<div class="print-sheet-header">' +
      '<div class="print-sheet-title">減価償却ドリル - 解答・解説</div>' +
      '<div class="print-sheet-meta">全' + printProblems.length + '問</div>' +
      '</div>';
    printProblems.forEach(function (p, idx) {
      html += '<div class="print-a-item' + (idx === 0 ? ' first' : '') + '">' +
        '<div class="print-a-number">第' + (idx + 1) + '問 <span class="print-type-tag" style="background:#6B6485;color:#fff;border-radius:999px;padding:2px 10px;font-size:10.5px;">' + levelLabel(p.level) + '</div>' +
        '<div class="print-a-answer">正解：' + yen(p.answer) + '</div>' +
        '<div class="print-a-explain">' + p.explain + '</div>' +
        '</div>';
    });
    return html;
  }

  printBtn.addEventListener('click', function () {
    const checked = document.querySelector('.diff-check:checked');
    const diff = checked ? checked.value : 'hard';
    if (diff === 'custom') {
      state.customMode = true;
      state.selectedTopics = getSelectedTopicCombos();
    } else {
      state.customMode = false;
      state.selectedLevels = levelsForDifficulty(diff);
    }
    state.retryQueue = null;
    printHideLevel = hideLevelCheck.checked;

    printProblems = [];
    const printCount = getQuestionCount();
    resetSessionUsed();
    for (let i = 0; i < printCount; i++) {
      printProblems.push(makeProblem());
    }

    printQuestionsSheet.innerHTML = buildPrintQuestionsHTML();
    printAnswersSheet.innerHTML = buildPrintAnswersHTML();
    requestAnimationFrame(function () { setTimeout(function () { checkTableScrollHints(printAnswersSheet); }, 350); });

    startPanel.classList.add('fade-out');
    setTimeout(function () {
      startPanel.style.display = 'none';
      startPanel.classList.remove('fade-out');
      window.scrollTo(0, 0);
      depreWrapEl.classList.add('print-mode');
      printQuestionsPanel.style.display = '';
      printQuestionsPanel.classList.add('fade-in');
      setTimeout(function () { printQuestionsPanel.classList.remove('fade-in'); }, 500);
    }, 380);
  });

  document.getElementById('printQBackBtn').addEventListener('click', function () {
    printQuestionsPanel.classList.add('fade-out');
    setTimeout(function () {
      printQuestionsPanel.style.display = 'none';
      printQuestionsPanel.classList.remove('fade-out');
      window.scrollTo(0, 0);
      depreWrapEl.classList.remove('print-mode');
      startPanel.style.display = '';
      startPanel.classList.add('fade-in');
      startBtn.disabled = false;
      setTimeout(function () { startPanel.classList.remove('fade-in'); }, 500);
    }, 380);
  });

  document.getElementById('printQRefreshBtn').addEventListener('click', function () {
    printQuestionsSheet.classList.add('fade-out');
    setTimeout(function () {
      const refreshCount = printProblems.length || getQuestionCount();
      printProblems = [];
      resetSessionUsed();
      for (let i = 0; i < refreshCount; i++) {
        printProblems.push(makeProblem());
      }
      printQuestionsSheet.innerHTML = buildPrintQuestionsHTML();
      printAnswersSheet.innerHTML = buildPrintAnswersHTML();
      requestAnimationFrame(function () { setTimeout(function () { checkTableScrollHints(printAnswersSheet); }, 350); });
      window.scrollTo(0, 0);
      printQuestionsSheet.classList.remove('fade-out');
      printQuestionsSheet.classList.add('fade-in');
      setTimeout(function () { printQuestionsSheet.classList.remove('fade-in'); }, 500);
    }, 200);
  });

  document.getElementById('printQShowAnswersBtn').addEventListener('click', function () {
    printQuestionsPanel.classList.add('fade-out');
    setTimeout(function () {
      printQuestionsPanel.style.display = 'none';
      printQuestionsPanel.classList.remove('fade-out');
      window.scrollTo(0, 0);
      printAnswersPanel.style.display = '';
      printAnswersPanel.classList.add('fade-in');
      setTimeout(function () { printAnswersPanel.classList.remove('fade-in'); }, 500);
    }, 380);
  });

  document.getElementById('printABackBtn').addEventListener('click', function () {
    printAnswersPanel.classList.add('fade-out');
    setTimeout(function () {
      printAnswersPanel.style.display = 'none';
      printAnswersPanel.classList.remove('fade-out');
      window.scrollTo(0, 0);
      printQuestionsPanel.style.display = '';
      printQuestionsPanel.classList.add('fade-in');
      setTimeout(function () { printQuestionsPanel.classList.remove('fade-in'); }, 500);
    }, 380);
  });

  document.getElementById('printQPrintBtn').addEventListener('click', function () { window.print(); });
  document.getElementById('printAPrintBtn').addEventListener('click', function () { window.print(); });
})();
