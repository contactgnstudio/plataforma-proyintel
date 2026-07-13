// ============================================================
// js/charts.js - Configuracion de graficas con Chart.js
// ============================================================

function crearChartEvolucion() {
  var ctx = document.getElementById('chartEvolucion');
  if (!ctx) return null;

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: datosMensuales.meses,
      datasets: [
        {
          label: 'Materiales',
          data: datosMensuales.materiales,
          borderColor: '#6bbd45',
          backgroundColor: 'rgba(107,189,69,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#6bbd45',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        },
        {
          label: 'Operativo',
          data: datosMensuales.operativo,
          borderColor: '#243b86',
          backgroundColor: 'rgba(36,59,134,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#243b86',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        },
        {
          label: 'Mano de Obra',
          data: datosMensuales.manoObra,
          borderColor: '#f5b923',
          backgroundColor: 'rgba(245,185,35,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#f5b923',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.95)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(107,189,69,0.3)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + fmt.format(context.raw);
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: 'rgba(255,255,255,0.5)' }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: 'rgba(255,255,255,0.5)',
            callback: function(value) {
              return '$' + (value / 1000).toFixed(0) + 'k';
            }
          }
        }
      }
    }
  });
}

function crearChartDistribucion() {
  var ctx = document.getElementById('chartDistribucion');
  if (!ctx) return null;

  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Materiales', 'Operativo', 'Mano de Obra'],
      datasets: [{
        data: [matActual, opActual, moActual],
        backgroundColor: ['#6bbd45', '#243b86', '#f5b923'],
        borderColor: '#0f172a',
        borderWidth: 4,
        hoverOffset: 12
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: 'rgba(255,255,255,0.7)',
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.95)',
          callbacks: {
            label: function(context) {
              var val = context.raw;
              var pct = ((val / totalActual) * 100).toFixed(1);
              return context.label + ': ' + fmt.format(val) + ' (' + pct + '%)';
            }
          }
        }
      }
    }
  });
}

function crearChartBarras() {
  var ctx = document.getElementById('chartBarras');
  if (!ctx) return null;

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: datosMensuales.meses,
      datasets: [
        {
          label: 'Materiales',
          data: datosMensuales.materiales,
          backgroundColor: '#6bbd45',
          borderRadius: 6,
          barPercentage: 0.7
        },
        {
          label: 'Operativo',
          data: datosMensuales.operativo,
          backgroundColor: '#243b86',
          borderRadius: 6,
          barPercentage: 0.7
        },
        {
          label: 'Mano de Obra',
          data: datosMensuales.manoObra,
          backgroundColor: '#f5b923',
          borderRadius: 6,
          barPercentage: 0.7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: 'rgba(255,255,255,0.6)', usePointStyle: true }
        },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.95)',
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + fmt.format(context.raw);
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: 'rgba(255,255,255,0.5)' }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: 'rgba(255,255,255,0.5)',
            callback: function(value) {
              return '$' + (value / 1000).toFixed(0) + 'k';
            }
          }
        }
      }
    }
  });
}

function crearChartTopGastos() {
  var ctx = document.getElementById('chartTopGastos');
  if (!ctx) return null;

  var gastos = obtenerGastos();
  var topGastos = gastos.slice().sort(function(a, b) { return b.total - a.total; }).slice(0, 10);

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: topGastos.map(function(g) {
        return g.descripcion.length > 28 ? g.descripcion.substring(0, 28) + '...' : g.descripcion;
      }),
      datasets: [{
        label: 'Monto',
        data: topGastos.map(function(g) { return g.total; }),
        backgroundColor: topGastos.map(function(g) {
          if (g.categoria === 'materiales') return '#6bbd45';
          if (g.categoria === 'operativo') return '#243b86';
          return '#f5b923';
        }),
        borderRadius: 6,
        barPercentage: 0.6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.95)',
          callbacks: {
            label: function(context) {
              return fmt.format(context.raw);
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: 'rgba(255,255,255,0.5)',
            callback: function(value) {
              return '$' + (value / 1000).toFixed(0) + 'k';
            }
          }
        },
        y: {
          grid: { display: false },
          ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 11 } }
        }
      }
    }
  });
}
