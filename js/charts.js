// ============================================================
// js/charts.js — Gráficas con Chart.js (CORREGIDO)
// ============================================================

var chartBalanceInstance = null;
var chartGastosInstance = null;

function inicializarCharts() {
  renderChartBalance();
  renderChartGastos();
}

function renderChartBalance() {
  var ctx = document.getElementById('chartBalance');
  if (!ctx) return;

  var gastos = getData(STORAGE_KEYS.GASTOS);
  var pagos = getData(STORAGE_KEYS.PAGOS);

  // Últimos 6 meses
  var mesesLabels = [];
  var ingresosData = [];
  var gastosData = [];
  var mesesMap = {};

  for (var i = 5; i >= 0; i--) {
    var d = new Date();
    d.setMonth(d.getMonth() - i);
    var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    var label = d.toLocaleDateString('es-PA', { month: 'short', year: '2-digit' });
    mesesMap[key] = { label: label, ingresos: 0, gastos: 0 };
    mesesLabels.push(label);
    ingresosData.push(0);
    gastosData.push(0);
  }

  for (var i = 0; i < pagos.length; i++) {
    var p = pagos[i];
    if (p.fecha) {
      var key = p.fecha.substring(0, 7);
      if (mesesMap[key] !== undefined) mesesMap[key].ingresos += parseFloat(p.monto) || 0;
    }
  }

  for (var i = 0; i < gastos.length; i++) {
    var g = gastos[i];
    if (g.fecha) {
      var key = g.fecha.substring(0, 7);
      if (mesesMap[key] !== undefined) mesesMap[key].gastos += parseFloat(g.monto) || 0;
    }
  }

  var idx = 0;
  for (var key in mesesMap) {
    ingresosData[idx] = mesesMap[key].ingresos;
    gastosData[idx] = mesesMap[key].gastos;
    idx++;
  }

  if (chartBalanceInstance) {
    chartBalanceInstance.destroy();
  }

  chartBalanceInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: mesesLabels,
      datasets: [
        {
          label: 'Ingresos',
          data: ingresosData,
          backgroundColor: 'rgba(107,189,69,0.7)',
          borderColor: '#6bbd45',
          borderWidth: 1,
          borderRadius: 6
        },
        {
          label: 'Gastos',
          data: gastosData,
          backgroundColor: 'rgba(239,68,68,0.7)',
          borderColor: '#ef4444',
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#8a8a96' } }
      },
      scales: {
        x: { ticks: { color: '#8a8a96' }, grid: { color: 'rgba(255,255,255,0.03)' } },
        y: { ticks: { color: '#8a8a96' }, grid: { color: 'rgba(255,255,255,0.03)' } }
      }
    }
  });
}

function renderChartGastos() {
  var ctx = document.getElementById('chartGastos');
  if (!ctx) return;

  var gastos = getData(STORAGE_KEYS.GASTOS);
  var categorias = {};

  for (var i = 0; i < gastos.length; i++) {
    var cat = gastos[i].categoria || 'otros';
    categorias[cat] = (categorias[cat] || 0) + (parseFloat(gastos[i].monto) || 0);
  }

  var labels = [];
  var data = [];
  var colors = ['#6bbd45', '#4f8cff', '#a855f7', '#f59e0b', '#ef4444', '#14b8a6', '#ec4899', '#06b6d4', '#f97316', '#8b5cf6'];

  var idx = 0;
  for (var cat in categorias) {
    labels.push(GASTO_LABELS[cat] || cat);
    data.push(categorias[cat]);
    idx++;
  }

  // Si no hay datos, mostrar placeholder
  if (data.length === 0) {
    labels = ['Sin datos'];
    data = [1];
    colors = ['rgba(255,255,255,0.1)'];
  }

  if (chartGastosInstance) {
    chartGastosInstance.destroy();
  }

  chartGastosInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#8a8a96', font: { size: 11 } } }
      }
    }
  });
}
