// script.js
let chart;
window.globalNodeMap = new Map();

(async function () {
  try {
    const rawData = await fetch('gia_pha_ho_dinh.json').then(r => r.json());
    
    // Map data for quick lookup
    rawData.forEach(d => window.globalNodeMap.set(d.id, d));
    
    // Convert to d3-org-chart format
    const chartData = rawData.map(node => {
      let spouses = [];
      if (node.pids && node.pids.length > 0) {
        node.pids.forEach(spouseId => {
          if (window.globalNodeMap.has(spouseId)) {
            spouses.push(window.globalNodeMap.get(spouseId));
          }
        });
      }

      return {
        ...node,
        parentId: node.pid || '',
        spouses: spouses
      };
    });

    // Clean up floating spouses
    const spouseIdsAsJoiners = new Set();
    chartData.forEach(d => {
       if(d.parentId === '' && d.pids && d.pids.length > 0) {
          d.pids.forEach(p => {
             const partner = window.globalNodeMap.get(p);
             if (partner && (partner.pid !== '' || partner.id === '1')) {
                 if (d.id !== '1') spouseIdsAsJoiners.add(d.id);
             }
          });
       }
    });

    // Helper to parse dates
    function parseDateForSort(dateStr) {
      if (!dateStr || dateStr.trim() === '') return 99999999;
      let s = dateStr.replace(/\s/g, '');
      let parts = s.includes('/') ? s.split('/') : s.split('-');
      if (parts.length === 1) {
        let year = parseInt(parts[0]);
        if (isNaN(year)) return 99999999;
        return year * 10000; 
      }
      if (parts.length === 3) {
        let day = parseInt(parts[0]) || 1;
        let month = parseInt(parts[1]) || 1;
        let year = parseInt(parts[2]);
        if (isNaN(year)) return 99999999;
        return year * 10000 + month * 100 + day;
      }
      return 99999999;
    }

    let finalTreeData = chartData.filter(d => !spouseIdsAsJoiners.has(d.id));
    
    // Group specific nodes that died young under a virtual parent
    const diedYoungIds = new Set(['15', '16', '17', '41', '42']);
    let hasDiedYoung = false;
    finalTreeData.forEach(d => {
       if (diedYoungIds.has(d.id)) {
           d.parentId = 'group_died_young';
           hasDiedYoung = true;
       }
    });

    if (hasDiedYoung) {
      finalTreeData.push({
        id: 'group_died_young',
        parentId: '1',
        name: 'Các con mất khi nhỏ',
        gender: 'male',
        birth_date: '9900', // Push to the end of the siblings
        title: '',
        spouses: []
      });
    }

    // Explicit ordering for generation 2
    const explicitOrder = {
        '3': 1, // Vệ
        '18': 2, // Liên
        '31': 3, // Khanh
        '43': 4, // Tình
        '60': 5, // Loan
        'group_died_young': 6
    };

    // Sort the tree
    function getSortVal(d) {
        if (d.title && d.title.toLowerCase().includes('con nuôi')) return 99999; 
        if (d.parentId === '1' && explicitOrder[d.id]) return explicitOrder[d.id] * 1000;
        return parseDateForSort(d.birth_date);
    }
    finalTreeData.sort((a, b) => getSortVal(a) - getSortVal(b));
    
    const isDoc = window.location.pathname.includes('doc.html');
    window.currentLayout = isDoc ? 'left' : 'top';
    
    // Render the chart
    chart = new d3.OrgChart()
      .container('#chart-container')
      .data(finalTreeData)
      .layout(window.currentLayout)
      .compact(false)
      .nodeWidth(function(d) {
        const numSpouses = d.data.spouses ? d.data.spouses.length : 0;
        if (window.currentLayout === 'left') {
            return 180; // fixed width if vertical stacking
        }
        return 180 + (numSpouses * 230); // 180 for card + 50 for gap + 180 for spouse
      })
      .initialZoom(0.85)
      .nodeHeight(function(d) {
        const numSpouses = d.data.spouses ? d.data.spouses.length : 0;
        if (window.currentLayout === 'left') {
            return 68 + (numSpouses * 84); // 68 card + 16 gap + 68 spouse
        }
        return 85; // Constant height in top layout
      }) 
      .childrenMargin((d) => 60)
      .siblingsMargin((d) => isDoc ? 8 : 40)
      .buttonContent(() => "") // Hide the expand/collapse tags
      .linkUpdate(function (d, i, arr, state) {
        d3.select(this)
          .attr('stroke', '#64748b')
          .attr('stroke-width', 2);
      })
      .nodeContent(function (d, i, arr, state) {
        const data = d.data;

        if (data.id === 'group_died_young') {
          return `
            <div style="background-color:#fef2f2; border:1px dashed #ef4444; border-radius:8px; padding:8px 10px; font-family:'Inter',sans-serif; width:100%; height:100%; box-sizing:border-box; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
              <div style="font-weight:700; font-size:12px; color:#b91c1c; text-align:center;">
                ${data.name}
              </div>
            </div>
          `;
        }

        const isLeftLayout = window.currentLayout === 'left';

        function extractDeathNote(notes) {
            if (!notes) return '';
            const match = notes.match(/(Mất:.*)/i);
            if (match) return match[1].trim();
            return '';
        }

        function createCardHtml(person, isLeft) {
            const isFemale = person.gender === 'female';
            let bgColor = isFemale ? 'var(--node-bg-female, #fce7f3)' : 'var(--node-bg-male, #e0f2fe)';
            let borderColor = isFemale ? 'var(--node-border-female, #f9a8d4)' : 'var(--node-border-male, #7dd3fc)';
            
            let bdateStr = person.birth_date ? `Sinh: ${person.birth_date}` : 'Sinh: Không rõ';
            let deathNote = extractDeathNote(person.notes);
            let deathHtml = deathNote ? `<div style="color:#ef4444; margin-top:2px;">${deathNote}</div>` : '';

            let dynWidth = 180;
            let dynHeight = isLeft ? 68 : 85;
            let dynPadding = isLeft ? '5px 10px' : '6px 10px';
            let nameMargin = isLeft ? '2px' : '3px';
            let fontSzInfo = isLeft ? '10px' : '11px';

            return `
            <!-- Person Card -->
            <div onclick="event.stopPropagation(); window.showModalForId('${person.id}')" style="cursor:pointer; background-color:${bgColor}; border:1px solid ${borderColor}; border-radius:8px; padding:${dynPadding}; color:#0f172a; font-family:'Inter',sans-serif; flex: 0 0 ${dynWidth}px; width:${dynWidth}px; height:${dynHeight}px; display:flex; flex-direction:column; justify-content:center; box-sizing:border-box; box-shadow:0 2px 4px rgba(0,0,0,0.05); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
              <div style="font-weight:700; font-size:12px; margin-bottom:${nameMargin}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#0f172a;">
                ${person.name}
              </div>
              <div style="font-size:${fontSzInfo}; color:#475569; display:flex; justify-content:space-between; align-items:center;">
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${bdateStr}</span>
                ${person.title && !person.title.includes('Con nuôi') ? `<span style="background:rgba(0,0,0,0.05); padding:1px 4px; border-radius:4px; font-size:8px; white-space:nowrap; flex-shrink:0;">${person.title}</span>` : ''}
              </div>
              ${deathHtml ? `<div style="font-size:9px; font-weight:600;">${deathHtml}</div>` : ''}
            </div>
            `;
        }
        
        let flexDir = isLeftLayout ? 'column' : 'row';

        let html = `
          <div style="display:flex; flex-direction:${flexDir}; align-items:center; height:100%; width:100%; box-sizing:border-box;">
            ${createCardHtml(data, isLeftLayout)}
        `;

        if (data.spouses && data.spouses.length > 0) {
          data.spouses.forEach(spouse => {
            if (isLeftLayout) {
                // Center the house icon on the node axis so the child link passes through it
                html += `
                  <div style="flex: 0 0 16px; width:100%; display:flex; align-items:center; justify-content:center; position:relative;">
                    <div style="position:absolute; left:50%; top:0; transform:translateX(-50%); height:16px; width:2px; background-color:#fda4af;"></div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.8; background:white; z-index:2; position:relative;"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                  </div>
                `;
            } else {
                // Horizontal connection + house icon
                html += `
                  <div style="flex: 0 0 50px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap: 2px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    <div style="width:100%; height:2px; background-color:#fda4af;"></div>
                  </div>
                `;
            }
            html += createCardHtml(spouse, isLeftLayout);
          });
        }

        html += `</div>`;
        return html;
      })
      .render()
      .expandAll();

  } catch (err) {
    console.error("Error building tree:", err);
    document.getElementById('chart-container').innerHTML = `<p style="color:red; margin:2rem;">Lỗi tải dữ liệu. Bật server trước.</p>`;
  }
})();

// Control Buttons
if (document.getElementById('btn-fit')) {
  document.getElementById('btn-fit').addEventListener('click', () => chart.fit());
  document.getElementById('btn-expand').addEventListener('click', () => chart.expandAll().fit());
  document.getElementById('btn-collapse').addEventListener('click', () => chart.collapseAll().fit());
}

// Modal Logic
const modal = document.getElementById('detail-modal');
const closeBtn = document.querySelector('.close-btn');

window.showModalForId = (id) => {
  const data = window.globalNodeMap.get(id);
  if (data) showModal(data);
};

function showModal(data) {
  document.getElementById('modal-name').textContent = data.name || 'Không rõ';
  document.getElementById('modal-title').textContent = data.title || (data.gender === 'female' ? 'Nữ giới' : 'Nam giới');
  document.getElementById('modal-birth').textContent = data.birth_date || 'Không có thông tin';
  document.getElementById('modal-hometown').textContent = data.hometown || 'Không có thông tin';
  document.getElementById('modal-notes').innerHTML = data.notes || '';
  
  const initials = data.name.split(' ').map(n=>n[0]).join('').slice(0,2) || '?';
  document.getElementById('modal-avatar').textContent = initials;
  
  let spouseText = 'Không có';
  if (data.pids && data.pids.length > 0) {
    spouseText = data.pids.map(sId => {
       const s = window.globalNodeMap.get(sId);
       return s ? s.name : '';
    }).filter(Boolean).join(', ');
  }
  document.getElementById('modal-spouses').textContent = spouseText;

  modal.classList.remove('hidden');
}

closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.add('hidden');
});
