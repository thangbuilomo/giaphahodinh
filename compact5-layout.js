let chart;

const COMPACT_PROFILE = {
  siblingMargin: 2,
  childrenMargin: 30,
  neighbourMargin: 2,
  initialZoom: 0.85,
  cardPadding: "5px",
  cardBorder: "1.8px solid black",
  nameFontSize: 14,
  metaFontSize: 12,
  deathFontSize: 12,
  fontFamily: "'Times New Roman', Times, serif"
};

(async function renderCompactChart() {
  try {
    let treeData = await window.loadFamilyTreeData();
    
    // Group simple siblings at depth >= 3
    const idMap = new Map();
    treeData.forEach(d => { idMap.set(d.id, d); d.myDepth = 0; d.stackedSiblings = []; });
    
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

    const childrenMap = new Map();
    treeData.forEach(d => {
        if (!childrenMap.has(d.parentId)) childrenMap.set(d.parentId, []);
        childrenMap.get(d.parentId).push(d);
    });

    const isSimple = (d) => {
        if (d.myDepth >= 4) return false; // Thế hệ 5 (như Lưu Quỳnh Mai, Hương Ly, Quang Huy) sẽ không bị gộp dọc
        return (!d.spouses || d.spouses.length === 0) && (!childrenMap.has(d.id) || childrenMap.get(d.id).length === 0);
    };

    const toRemove = new Set();
    childrenMap.forEach((children, parentId) => {
        if (children.length > 0 && children[0].myDepth >= 3) {
            const simpleChildren = children.filter(c => isSimple(c));
            if (simpleChildren.length > 1) {
                const primary = simpleChildren[0];
                for (let i = 1; i < simpleChildren.length; i++) {
                    primary.stackedSiblings.push(simpleChildren[i]);
                    toRemove.add(simpleChildren[i].id);
                }
            }
        }
    });

    const visibleData = treeData.filter(d => !toRemove.has(d.id));
    chart = createCompactChart("#chart-container", visibleData, COMPACT_PROFILE);
    
    window.initPersonModal();
    window.bindChartControls(() => chart);
    
    // Hàm tải xuống trực tiếp file Vector .svg (Tính toán Bounding Box hoàn hảo)
    window.downloadVectorSVG = function(isA4 = false) {
        if (!chart) {
            alert("Không tìm thấy dữ liệu sơ đồ!");
            return;
        }

        const originalSvg = document.querySelector('#chart-container svg');
        const chartGroupDom = originalSvg.querySelector('.chart');
        
        if (!originalSvg || !chartGroupDom) return;

        // Dùng getBBox() chuẩn của Browser để lấy chính xác tạo độ và kích thước khung ảnh
        const bbox = chartGroupDom.getBBox();
        let minX = bbox.x;
        let minY = bbox.y;
        let outerWidth = bbox.width;
        let outerHeight = bbox.height;

        // Tính khoảng trống (Padding)
        const padX = 50, padY = 50;
        minX -= padX; minY -= padY;
        outerWidth += padX * 2; outerHeight += padY * 2;

        // Clone SVG hiện tại để xử lý
        const clonedSvg = originalSvg.cloneNode(true);

        // Can thiệp bóc tách Group chứa nội dung
        const chartGroup = clonedSvg.querySelector('.chart');
        if (chartGroup) {
            // Xóa transform do người dùng kéo thả, trả về tâm tọa độ gốc
            chartGroup.setAttribute('transform', '');
        }

        // Cập nhật ViewBox và kích thước hoàn hảo nhất cho in ấn
        clonedSvg.setAttribute('viewBox', `${minX} ${minY} ${outerWidth} ${outerHeight}`);
        
        if (isA4) {
            clonedSvg.setAttribute('width', '100%');
            clonedSvg.setAttribute('height', '100%');
            // Căn giữa khi mở trên giấy
            clonedSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        } else {
            clonedSvg.setAttribute('width', `${outerWidth}`);
            clonedSvg.setAttribute('height', `${outerHeight}`);
        }

        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(clonedSvg);
        
        // Thêm namespace nếu thiếu
        if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if(!source.match(/^<svg[^>]+xmlns\:xlink="http\:\/\/www\.w3\.org\/1999\/xlink"/)){
            source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }

        // Chuyển đổi thành Data URI (Base64)
        const b64 = btoa(unescape(encodeURIComponent(source)));
        const downloadLink = document.createElement("a");
        downloadLink.href = 'data:image/svg+xml;base64,' + b64;
        
        const fileType = isA4 ? "A4" : "Goc";
        downloadLink.download = `gia-pha-ho-dinh-vector-${fileType}-${new Date().getTime()}.svg`;
        downloadLink.style.display = "none";
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        setTimeout(() => {
            document.body.removeChild(downloadLink);
        }, 100);
    };
    
  } catch (err) {
    console.error("Error rendering compact chart:", err);
  }
})();

function createCompactChart(containerSelector, treeData, profile) {
  const chartInstance = new d3.OrgChart()
    .container(containerSelector)
    .data(treeData)
    .layout("top")
    .nodeWidth((node) => {
      let base = 85; 
      if (node.depth === 0) {
          const spouseCount = node.data.spouses ? node.data.spouses.length : 0;
          base = 140 * (1 + spouseCount) + (spouseCount * 10); // Thêm khoảng cách giữa 2 cụ
      }
      if (node.depth === 1) base = 110;
      if (node.depth >= 2) base = 65;
      return base;
    })
    .nodeHeight((node) => {
      let h = 120; 
      if (node.depth === 0) h = 160;
      if (node.depth === 1) h = 140;
      if (node.depth >= 2) h = node.data.name.split(' ').length * 16 + 12;
      
      const pSpouseCount = node.data.spouses ? node.data.spouses.length : 0;
      let totalH = h;
      
      if (node.depth === 0) {
          // Đời 0 xếp ngang nên cao chỉ bằng 1 ô
          totalH = h;
      } else if (pSpouseCount > 0 && node.depth >= 2) {
          node.data.spouses.forEach(s => {
              let prefix = "";
              if (s.gender === "male" || node.data.gender === "female") prefix = "(Chồng) ";
              else prefix = "(Vợ) ";
              const displayName = prefix + s.name.toUpperCase();
              totalH += displayName.split(' ').length * 16 + 12;
          });
      } else if (pSpouseCount > 0) {
          totalH += h * pSpouseCount;
      }
      
      if (node.data.stackedSiblings && node.data.stackedSiblings.length > 0) {
          node.data.stackedSiblings.forEach(sib => {
              totalH += sib.name.split(' ').length * 16 + 12 + 15; // Include 15px line gap
          });
      }
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
        .attr("stroke-width", 1.8);
    })
    .nodeContent((node) => {
      const person = node.data;
      
      let baseW = 85;
      let baseH = 120;
      if (node.depth === 0) { baseW = 140; baseH = 160; }
      if (node.depth === 1) { baseW = 110; baseH = 140; }
      if (node.depth >= 2) { baseW = 65; }

      function renderBox(p, bw, bh_default, isSpouse = false, spousePrefix = "") {
        let titleStr = "";
        let birthStr = "";
        let deathHtml = "";
        let bh = bh_default;
        
        let displayName = spousePrefix + p.name.toUpperCase();
        if (displayName.includes("CAC CON MAT KHI NHO")) {
            displayName = displayName.replace("CAC CON MAT KHI NHO", "CÁC CON MẤT KHI NHỎ");
        }

        if (node.depth >= 2) {
            bh = displayName.split(' ').length * 16 + 12;
        } else if (node.depth < 2) {
            titleStr = p.title ? `<div style="font-size: ${profile.metaFontSize}px; margin-bottom: 2px; font-weight: normal;">${p.title}</div>` : "";
            birthStr = (p.birth_date && p.birth_date !== "9900") ? `Sinh: ${p.birth_date}` : "";
            const deathNote = window.getDeathNote(p.notes);
            deathHtml = deathNote 
              ? `<div style="font-size: ${profile.deathFontSize}px; color: black; margin-top:2px;">${deathNote}</div>` : "";
        }

        let nameHtml = "";
        if (node.depth >= 2) {
            const words = displayName.split(' ').join('<br>');
            nameHtml = `<div style="font-weight: bold; font-size: 13px; color: black; line-height: 1.25; margin-bottom: 0;">${words}</div>`;
            if (isSpouse) {
                // Thêm đường kẻ ngang nhỏ phân cách giữa vợ/chồng theo sketch 
                nameHtml = `<div style="width: 100%; height: 1px; background: black; position: absolute; top: 0;"></div>` + nameHtml;
            }
        } else {
            let horizontalName = spousePrefix ? `${spousePrefix.trim()}<br>${p.name.toUpperCase()}` : p.name.toUpperCase();
            if (horizontalName.includes("CAC CON MAT KHI NHO")) {
                horizontalName = horizontalName.replace("CAC CON MAT KHI NHO", "CÁC CON MẤT KHI NHỎ");
            }
            nameHtml = `<div style="font-weight: bold; font-size: ${profile.nameFontSize}px; color: black; line-height: 1.2; margin-bottom: ${node.depth >= 2 ? '0' : '4px'};">${horizontalName}</div>`;
        }

        return `
          <div 
            onclick="event.stopPropagation(); window.showModalForId('${p.id}')"
            style="
            width: ${bw}px; 
            height: ${bh}px; 
            background: white; 
            border: ${profile.cardBorder}; 
            ${isSpouse && node.depth > 0 ? 'border-top: none;' : ''}
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
            position: relative;
            flex-shrink: 0;
          ">
            ${titleStr}
            ${nameHtml}
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
            let prefix = "";
            if (s.gender === "male" || p.gender === "female") prefix = "(Chồng) ";
            else prefix = "(Vợ) ";
            h += renderBox(s, bw, bh, true, prefix);
          });
        }
        return h;
      }

      let html = `<div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center;">`;
      
      // Parent tier
      const isHorizontalRoot = (node.depth === 0);
      html += `<div style="display:flex; flex-direction:${isHorizontalRoot ? 'row' : 'column'}; align-items:center; justify-content:center; gap: ${isHorizontalRoot ? '10px' : '0'};">`;
      html += renderBox(person, baseW, baseH, false);
      html += renderSpouses(person, baseW, baseH);
      html += `</div>`;

      // Stacked Sibling tier (only for simple siblings at depth >= 3)
      if (person.stackedSiblings && person.stackedSiblings.length > 0) {
        html += `<div style="display:flex; flex-direction:column; align-items:center;">`;
        person.stackedSiblings.forEach(sib => {
           html += `<div style="width:1px; height:15px; background:black;"></div>`;
           html += `<div style="display:flex; flex-direction:column; align-items:center; justify-content:flex-start;">`;
           html += renderBox(sib, baseW, 0, false); 
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
