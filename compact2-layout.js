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
    
    // Process depth and group Gen 4+ under Gen 3
    const idMap = new Map();
    treeData.forEach(d => { idMap.set(d.id, d); d.myDepth = 0; d.stackedChildren = []; });
    
    let changed = true;
    while(changed) {
        changed = false;
        treeData.forEach(d => {
            if (d.parentId && idMap.has(d.parentId)) {
                let p = idMap.get(d.parentId);
                if (d.myDepth !== p.myDepth + 1) {
                    d.myDepth = p.myDepth + 1;
                    changed = true;
                }
            }
        });
    }

    const visibleData = [];
    treeData.forEach(d => {
        if (d.myDepth <= 2) {
            visibleData.push(d);
        } else {
            let curr = d;
            while(curr && curr.myDepth > 2) {
                curr = idMap.get(curr.parentId);
            }
            if (curr && curr.myDepth === 2) {
                curr.stackedChildren.push(d);
            }
        }
    });

    chart = createCompactChart("#chart-container", visibleData, COMPACT_PROFILE);
    
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
      let base = 70; 
      if (node.depth === 0) base = 120;
      if (node.depth === 1) base = 90;
      
      const pSpouseCount = node.data.spouses ? node.data.spouses.length : 0;
      let mw = base + pSpouseCount * (base + 10);
      
      if (node.data.stackedChildren && node.data.stackedChildren.length > 0) {
         node.data.stackedChildren.forEach(child => {
            const cSpouseCount = child.spouses ? child.spouses.length : 0;
            const cw = 70 + cSpouseCount * (70 + 10); 
            if (cw > mw) mw = cw;
         });
      }
      return mw;
    })
    .nodeHeight((node) => {
      let h = 110; 
      if (node.depth === 0) h = 160;
      if (node.depth === 1) h = 140;
      
      if (node.data.stackedChildren && node.data.stackedChildren.length > 0) {
          h += node.data.stackedChildren.length * 105; // cH (90) + margin (15)
      }
      return h;
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
      
      let baseW = 70;
      let baseH = 110;
      if (node.depth === 0) { baseW = 120; baseH = 160; }
      if (node.depth === 1) { baseW = 90; baseH = 140; }

      function renderBox(p, bw, bh) {
        const birthStr = p.birth_date ? `S: ${p.birth_date}` : "";
        const deathNote = window.getDeathNote(p.notes);
        const deathHtml = deathNote 
          ? `<div style="font-size: ${profile.deathFontSize}px; color: black; margin-top:2px;">M: ${deathNote}</div>` : "";
        const titleStr = p.title ? `<div style="font-size: ${profile.metaFontSize}px; margin-bottom: 2px; font-weight: normal;">${p.title}</div>` : "";

        return `
          <div 
            onclick="event.stopPropagation(); window.showModalForId('${p.id}')"
            style="
            width: ${bw}px; 
            height: ${bh}px; 
            background: white; 
            border: ${profile.cardBorder}; 
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
            <div style="font-weight: bold; font-size: ${profile.nameFontSize}px; color: black; line-height: 1.2; margin-bottom: 4px;">
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
            h += `
              <div style="width: 10px; height: 1px; background: black; margin-top: ${bh/2}px;"></div>
              ${renderBox(s, bw, bh)}
            `;
          });
        }
        return h;
      }

      let html = `<div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center;">`;
      
      // Parent tier
      html += `<div style="display:flex; flex-direction:row; align-items:flex-start; justify-content:center;">`;
      html += renderBox(person, baseW, baseH);
      html += renderSpouses(person, baseW, baseH);
      html += `</div>`;

      // Stacked tier
      if (person.stackedChildren && person.stackedChildren.length > 0) {
        const cW = 70; 
        const cH = 90;  
        html += `<div style="display:flex; flex-direction:column; align-items:center;">`;
        person.stackedChildren.forEach(child => {
           html += `<div style="width:1px; height:15px; background:black;"></div>`;
           html += `<div style="display:flex; flex-direction:row; align-items:flex-start; justify-content:center;">`;
           html += renderBox(child, cW, cH);
           html += renderSpouses(child, cW, cH);
           html += `</div>`;
        });
        html += `</div>`;
      }

      html += `</div>`;
      return html;
    });

  chartInstance.render().expandAll();
  return chartInstance;
}
