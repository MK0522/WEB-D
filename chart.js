// 벤더별 x 오프셋으로 세대 안에서 row 구분
const vendors = [
    { name: 'NVIDIA', color: '#76B900', offset: -0.55 },
    { name: 'AMD', color: '#ED1C24', offset: 0 },
    { name: 'INTEL', color: '#0071C5', offset: 0.55 }
];
// 세대 사이에 빈 열(구분선) 간격 값.
const generationSpacing = 2;
const scoreFormatter = new Intl.NumberFormat('ko-KR');

Chart.register(ChartDataLabels);

const generationSeparatorLines = {
    id: 'generationSeparatorLines',
    beforeDatasetsDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        const xScale = scales.x;

        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.lineWidth = 1;

        // 각 세대 사이 빈 열에만 세로 구분선
        for (let genIdx = 0; genIdx < dataJson.length - 1; genIdx += 1) {
            const separatorX = genIdx * generationSpacing + 1;
            const pixelX = xScale.getPixelForValue(separatorX);
            ctx.beginPath();
            ctx.moveTo(pixelX, chartArea.top);
            ctx.lineTo(pixelX, chartArea.bottom);
            ctx.stroke();
        }

        ctx.restore();
    }
};

// 점수 구간별 배경 밴드로 표시
const recommendationBands = {
    id: 'recommendationBands',
    beforeDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        const yScale = scales.y;

        if (!chartArea || !yScale) {
            return;
        }

        // 추후에 별도 json으로 관리
        const bands = [
            {
                min: 4000, max: 5000,
                label: '게임용 최소',
                color: 'rgba(236, 28, 28, 0.14)'
            },
            {
                min: 8000, max: 9000,
                label: '게임용 추천',
                color: 'rgba(28, 167, 236, 0.14)'
            },
            {
                min: 10000, max: 14000,
                label: '게임방송 최소',
                color: 'rgba(53, 208, 127, 0.13)'
            },
            {
                min: 20000, max: 24000,
                label: '버추얼 게임방송 권장',
                color: 'rgba(206, 250, 33, 0.16)'
            },
            {
                min: 27500, max: 33000,
                label: '4K 게이밍 추천',
                color: 'rgba(0, 200, 255, 0.16)'
            },
            {
                min:48052, max: 48559,
                label: '현시점 지존',
                color: 'rgba(255, 0, 255, 0.18)'
            }
        ];

        ctx.save();
        ctx.beginPath();
        ctx.rect(
            chartArea.left,
            chartArea.top,
            chartArea.right - chartArea.left,
            chartArea.bottom - chartArea.top
        );
        ctx.clip();

        bands.forEach((band) => {
            const top = yScale.getPixelForValue(band.max);
            const bottom = yScale.getPixelForValue(band.min);
            const height = bottom - top;

            if (height <= 0) {
                return;
            }

            ctx.fillStyle = band.color;
            ctx.fillRect(chartArea.left, top, chartArea.right - chartArea.left, height);

            ctx.font = '700 12px system-ui, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255,255,255,0.75)';
            ctx.fillText(band.label, chartArea.right - 8, top + height / 2);
        });

        ctx.restore();
    }
};

// 모델명에 마우스 호버시 오버레이
const hoverLabelOverlay = {
    id: 'hoverLabelOverlay',
    afterDraw(chart) {
        // hover된 항목을 마지막에 다시 그려 항상 최상단에 표시
        const active = chart.$hoveredPoint;
        if (!active) {
            return;
        }

        const dataset = chart.data.datasets[active.datasetIndex];
        const raw = dataset?.data?.[active.index];
        const point = chart.getDatasetMeta(active.datasetIndex)?.data?.[active.index];
        if (!raw || !point) {
            return;
        }

        const { x, y } = point.getProps(['x', 'y'], true);
        const text = `${raw.model} | ${scoreFormatter.format(raw.score)}점`;
        const { ctx, chartArea } = chart;

        ctx.save();
        ctx.font = '700 14px system-ui, sans-serif';
        ctx.textBaseline = 'middle';
        const textWidth = ctx.measureText(text).width;
        const boxPaddingX = 8;
        const boxPaddingY = 5;
        const boxWidth = textWidth + boxPaddingX * 2;
        const boxHeight = 14 + boxPaddingY * 2;
        const boundaryPadding = 6;
        const minX = chartArea.left + boundaryPadding;
        const maxX = chartArea.right - boxWidth - boundaryPadding;
        const minY = chartArea.top + boundaryPadding;
        const maxY = chartArea.bottom - boxHeight - boundaryPadding;
        const boxX = Math.min(Math.max(x - boxWidth / 2, minX), maxX);
        const boxY = Math.min(Math.max(y - boxHeight / 2, minY), maxY);

        ctx.fillStyle = 'rgba(20,20,20,0.9)';
        ctx.strokeStyle = dataset.borderColor;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, boxX + boxPaddingX, boxY + boxHeight / 2);
        ctx.restore();
    }
};

// 레이블 그리는 오버레이
const axisLabelOverlay = {
    id: 'axisLabelOverlay',
    afterDraw(chart) {
        const { ctx, chartArea } = chart;

        ctx.save();

        // 좌상단 레이블(Score)
        const scoreText = '점수';
        ctx.font = '700 24px system-ui, sans-serif';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(scoreText, chartArea.left - 36, chartArea.top - 82);

        // 우하단 레이블(Generation)
        const generationText = '세대';
        ctx.font = '700 24px system-ui, sans-serif';
        ctx.textBaseline = 'top';
        const generationTextWidth = ctx.measureText(generationText).width;
        const generationX = chartArea.right - generationTextWidth;
        const generationY = chartArea.bottom + 24;

        ctx.fillStyle = '#ffffff';
        ctx.fillText(generationText, generationX, generationY);

        ctx.restore();
    }
};

const datasets = vendors.map((vendor, vendorIdx) => {
    const points = [];

    dataJson.forEach((generation, genIdx) => {
        const cards = generation[vendorIdx] || [];

        cards.forEach((card) => {
            const model = card[0];
            const score = card[1];

            // x=세대(+벤더 오프셋), y=점수로 배치
            points.push({
                x: genIdx * generationSpacing + vendor.offset,
                y: score,
                model,
                score
            });
        });
    });

    return {
        label: vendor.name,
        data: points,
        parsing: false,
        // 점은 숨기고 텍스트 라벨만 보여 가독성 향상
        pointRadius: 0,
        pointHoverRadius: 0,
        pointHitRadius: 10,
        backgroundColor: vendor.color,
        borderColor: vendor.color,
    };
});

new Chart(document.getElementById('mychart'), {
    type: 'scatter',
    plugins: [recommendationBands, generationSeparatorLines, hoverLabelOverlay, axisLabelOverlay],
    data: {
        datasets
    },
    options: {
        // 브라우저 크기 변경과 무관하게 고정 크기를 유지
        responsive: false,
        maintainAspectRatio: false,
        layout: {
            padding: {
                top: 88,
                left: 92,
                right: 24,
                bottom: 96
            }
        },
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: '#e0e0e0',
                    usePointStyle: true,
                    boxWidth: 10,
                    boxHeight: 10,
                    padding: 16,
                    font: {
                        size: 12,
                        weight: '600'
                    }
                }
            },
            tooltip: {
                enabled: false,
                callbacks: {
                    label(context) {
                        const raw = context.raw;
                        return `${raw.model} | ${scoreFormatter.format(raw.score)}점`;
                    }
                }
            },
            datalabels: {
                color(context) {
                    return context.dataset.borderColor;
                },
                // 기본 표시는 모델명만, 상세는 hover 오버레이에서 보여준다.
                formatter(value) {
                    return value.model;
                },
                align: 'center',
                anchor: 'center',
                xAdjust: 0,
                clip: false,
                font() {
                    return {
                        size: 11,
                        weight: '500'
                    };
                },
                backgroundColor: 'rgba(0,0,0,0)',
                borderWidth: 0,
                padding: 0
            }
        },
        scales: {
            x: {
                type: 'linear',
                min: -1,
                max: (dataJson.length - 1) * generationSpacing + 1,
                display: false,
                ticks: { stepSize: 1 }
            },
            y: {
                type: 'linear',
                title: { display: false },
                min: 0,
                max: 50000,
                ticks: {
                    stepSize: 1000,
                    // Y축 눈금은 K 단위로 표기한다.
                    callback(value) {
                        return `${Math.round(value / 1000)}K`;
                    }
                },
                grid: {
                    // 5000은 흰 실선, 1000은 반투명 점선으로 구분한다.
                    color(context) {
                        const value = context.tick.value;
                        if (value === 50000) {
                            return 'rgba(255,255,255,1)';
                        }
                        if (value % 5000 === 0) {
                            return 'rgba(255,255,255,0.9)';
                        }
                        if (value % 1000 === 0) {
                            return 'rgba(255,255,255,0.22)';
                        }
                        return 'rgba(0,0,0,0)';
                    },
                    borderDash(context) {
                        const value = context.tick.value;
                        if (value === 50000) {
                            return [];
                        }
                        if (value % 5000 === 0) {
                            return [];
                        }
                        if (value % 1000 === 0) {
                            return [4, 4];
                        }
                        return [];
                    },
                    lineWidth(context) {
                        const value = context.tick.value;
                        if (value === 50000) {
                            return 2.4;
                        }
                        return value % 5000 === 0 ? 1.2 : 1;
                    }
                }
            }
        },
        interaction: {
            mode: 'nearest',
            intersect: true
        },
        onHover(event, elements, chart) {
            chart.$hoveredPoint = elements[0] || null;
            chart.canvas.style.cursor = elements.length ? 'pointer' : 'default';
            chart.draw();
        }
    }
});