let chart;

const COMPACT_PROFILE = {
  siblingMargin: 2,
  childrenMargin: 30,
  neighbourMargin: 2,
  initialZoom: 0.85,
  cardPadding: "5px",
  cardBorder: "1px solid black",
  nameFontSize: 12,
  metaFontSize: 10,
  deathFontSize: 10,
  fontFamily: "'Times New Roman', Times, serif"
};

(async function renderCompactChart() {
  try {
    let treeData = await window.loadFamilyTreeData();
    chart = createCompactChart("#chart-container", treeData, COMPACT_PROFILE);
    
    window.initPersonModal();
    window.bindChartControls(() => chart);
    
  } catch (err) {
    console.error("Error rendering compact chart:", err);
  }
})();

function createCompactChart(containerSelector, treeData, profile) {
  const chartInstance = new d3.OrgChart()
    .container(containerSelector)
    .data(treeData)
    .layout("top")
    .compact(true) 
    .compactMarginBetween((d) => 5)
    .compactMarginPair((d) => 5)
    .nodeWidth((node) => {
      let base = 75; 
      if (node.depth === 0) base = 120;
      if (node.depth === 1) base = 95;
      return base;
    })
    .nodeHeight((node) => {
      let h = 100; 
      if (node.depth === 0) h = 140;
      if (node.depth === 1) h = 120;
      if (node.depth >= 2) h = 60; // Chỉ hiện họ tên nên chiều cao nhỏ lại
      
      const pSpouseCount = node.data.spouses ? node.data.spouses.length : 0;
      let totalH = h * (1 + pSpouseCount);
      return totalH;
    })
    .childrenMargin((node) => profile.childrenMargin)
    .siblingsMargin((node) => profile.siblingMargin)
    .neighbourMargin((n1, n2) => profile.neighbourMargin)
    .initialZoom(profile.initialZoom)
    .buttonContent(() => "") 
    .linkUpdate(function (d, i, arr) {
      d3.select(this)
        .attr("stroke", "black")
        .attr("stroke-width", 1);
    })
    .nodeContent((node) => {
      const person = node.data;
      
      let baseW = 75;
      let baseH = 100;
      if (node.depth === 0) { baseW = 120; baseH = 140; }
      if (node.depth === 1) { baseW = 95; baseH = 120; }
      if (node.depth >= 2) { baseW = 75; baseH = 60; }

      function renderBox(p, bw, bh, isSpouse = false) {
        let titleStr = "";
        let birthStr = "";
        let deathHtml = "";

        if (node.depth < 2) {
          titleStr = p.title ? `<div style="font-size: ${profile.metaFontSize}px; margin-bottom: 2px; font-weight: normal;">${p.title}</div>` : "";
          birthStr = p.birth_date ? `S: ${p.birth_date}` : "";
          const deathNote = window.getDeathNote(p.notes);
          deathHtml = deathNote 
            ? `<div style="font-size: ${profile.deathFontSize}px; color: black; margin-top:2px;">M: ${deathNote}</div>` : "";
        }

        return `
          <div 
            onclick="event.stopPropagation(); window.showModalForId('${p.id}')"
            style="
            width: ${bw}px; 
            height: ${bh}px; 
            background: white; 
            border: ${profile.cardBorder}; 
            ${isSpouse ? 'border-top: none;' : ''}
            box-sizing: border-box;
            padding: ${profile.cardPadding};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: ${profile.fontFamily};
            text-align: center;
            cursor: pointer;
            overflow: hidden;
            flex-shrink: 0;
          ">
            ${titleStr}
            <div style="font-weight: bold; font-size: ${profile.nameFontSize}px; color: black; line-height: 1.2; margin-bottom: ${node.depth >= 2 ? '0' : '4px'};">
              ${p.name.toUpperCase()}
            </div>
            <div style="font-size: ${profile.metaFontSize}px; color: black;">
              ${birthStr}
            </div>
            ${deathHtml}
          </div>
        `;
      }

      function renderSpouses(p, bw, bh) {
        let h = "";
        if (p.spouses && p.spouses.length > 0) {
          p.spouses.forEach(s => {
            h += renderBox(s, bw, bh, true);
          });
        }
        return h;
      }

      let html = `<div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center;">`;
      
      // Parent tier
      html += `<div style="display:flex; flex-direction:column; align-items:center; justify-content:flex-start;">`;
      html += renderBox(person, baseW, baseH, false);
      html += renderSpouses(person, baseW, baseH);
      html += `</div>`;

      html += `</div>`;
      return html;
    });

  chartInstance.render().expandAll();
  return chartInstance;
}
