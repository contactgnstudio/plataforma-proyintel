// ============================================================
// js/charts.js — Gráficas con Chart.js
// ============================================================

var chartBalanceInstance = null;
var chartGastosInstance = null;

function inicializarCharts() {
  renderChartBalance();
  renderChartGastos();
}

function renderChartBalance() {
  var canvas = document.getElementById('chartBalance');
  if (!canvas || typeof Chart === 'undefined') return;

  var gastos = getData(STORAGE_KEYS.GASTOS);
  var pagos = getData(STORAGE_KEYS.PAGOS);

  var meses = [];
  var ingresosData = [];
  var gastosData = [];
  var mesesMap = {};

  for (var i = 5; i >= 0; i--) {
    var d = new Date();
    d.setMonth(d.getMonth() - i);

    var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    var label = d.toLocaleDateString('es-PA', { month: 'short', year: '2-digit' });

    meses.push(label);
    mesesMap[key] = { ingresos: 0, gastos: 0 };
  }

  for (var j = 0; j < pagos.length; j++) {
    var p = pagos[j];
    if (!p.fecha) continue;
    var keyPago = String(p.fecha).substring(0, 7);
    if (mesesMap[keyPago]) {
      mesesMap[keyPago].ingresos += parseFloat(p.monto) || 0;
    }
  }

  for (var k = 0; k < gastos.length; k++) {
    var g = gastos[k];
    if (!g.fecha) continue;
    var keyGasto = String(g.fecha).substring(0, 7);
    if (mesesMap[keyGasto]) {
      mesesMap[keyGasto].gastos += parseFloat(g.monto) || 0;
    }
  }

  for (var key in mesesMap) {
    ingresosData.push(mesesMap[key].ingresos);
    gastosData.push(mesesMap[key].gastos);
  }

  if (chartBalanceInstance) chartBalanceInstance.destroy();

  chartBalanceInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: meses,
      datasets: [
        {
          label: 'Ingresos',
          data: ingresosData,
          backgroundColor: 'rgba(45,139,94,0.75)',
          borderColor: '#2D8B5E',
          borderWidth: 1,
          borderRadius: 6
        },
        {
          label: 'Gastos',
          data: gastosData,
          backgroundColor: 'rgba(248,113,113,0.75)',
          borderColor: '#F87171',
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#9CA3AF' }
        }
      },
      scales: {
        x: {
          ticks: { color: '#9CA3AF' },
          grid: { color: 'rgba(18,53,36,0.15)' }
        },
        y: {
          ticks: { color: '#9CA3AF' },
          grid: { color: 'rgba(18,53,36,0.15)' }
        }
      }
    }
  });
}

function renderChartGastos() {
  var canvas = document.getElementById('chartGastos');
  if (!canvas || typeof Chart === 'undefined') return;

  var gastos = getData(STORAGE_KEYS.GASTOS);
  var categorias = {};

  for (var i = 0; i < gastos.length; i++) {
    var cat = gastos[i].categoria || 'otros';
    categorias[cat] = (categorias[cat] || 0) + (parseFloat(gastos[i].monto) || 0);
  }

  var labels = [];
  var data = [];
  var colors = ['#2D8B5E', '#C5A253', '#C5A253', '#C5A253', '#F87171', '#2D8B5E', '#ec4899', '#06b6d4', '#f97316', '#8b5cf6'];
  var idx = 0;

  for (var categoria in categorias) {
    labels.push((typeof GASTO_LABELS !== 'undefined' && GASTO_LABELS[categoria]) ? GASTO_LABELS[categoria] : categoria);
    data.push(categorias[categoria]);
    idx++;
  }

  if (data.length === 0) {
    labels = ['Sin datos'];
    data = [1];
    colors = ['rgba(255,255,255,0.10)'];
  }

  if (chartGastosInstance) chartGastosInstance.destroy();

  chartGastosInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, data.length),
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#9CA3AF',
            font: { size: 11 }
          }
        }
      }
    }
  });
}
