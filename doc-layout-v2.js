let chart;

const SCREEN_PROFILE = {
  cardWidth: 220,
  cardHeight: 82,
  connectorGap: 26,
  childrenMargin: 110,
  siblingMargin: 34,
  initialZoom: 0.78,
  cardPadding: "10px 14px",
  cardRadius: 12,
  nameFontSize: 12,
  nameGap: 4,
  metaFontSize: 10,
  deathFontSize: 10,
  badgeFontSize: 8,
  badgeMarginTop: 6,
  badgePadding: "2px 6px",
  shadow: "0 4px 12px rgba(15,23,42,0.06)",
  hoverShadow: "0 8px 18px rgba(15,23,42,0.10)",
  interactive: true,
  linkWidth: 2,
  groupPadding: "12px 14px",
  groupRadius: 12,
  groupShadow: "0 4px 12px rgba(15,23,42,0.06)",
  connectorBadgeSize: 18,
  connectorIconSize: 12,
};

const PRINT_PROFILE = {
  cardWidth: 176,
  cardHeight: 66,
  connectorGap: 12,
  childrenMargin: 56,
  siblingMargin: 18,
  initialZoom: 1,
  cardPadding: "7px 9px",
  cardRadius: 8,
  nameFontSize: 9.5,
  nameGap: 2,
  metaFontSize: 7.5,
  deathFontSize: 7.5,
  badgeFontSize: 6.5,
  badgeMarginTop: 4,
  badgePadding: "1px 4px",
  shadow: "0 1px 3px rgba(15,23,42,0.06)",
  hoverShadow: "0 1px 3px rgba(15,23,42,0.06)",
  interactive: false,
  linkWidth: 1.5,
  groupPadding: "8px 10px",
  groupRadius: 8,
  groupShadow: "0 1px 3px rgba(15,23,42,0.06)",
  connectorBadgeSize: 12,
  connectorIconSize: 9,
};

const EXPORT_PROFILE = {
  filenamePrefix: "gia-pha-doc-a3",
  pageFormat: "a3",
  pageOrientation: "landscape",
  stageWidthPx: 1600,
  stageHeightPx: 1131,
  stagePaddingPx: 24,
  captureScale: 3,
};

window.currentLayout = "left";
const printView = window.getPrintViewState();

window.initPersonModal();
if (!printView.enabled) {
  window.bindChartControls(() => chart);
  window.bindPdfExportButton(() => window.openPrintWindow());
} else {
  window.setupPrintSheet({
    title: "Gia pha ho Dinh",
    subtitle: "Ban in A3 toi uu cho so do doc",
  });
}

(async function renderVerticalChartPage() {
  try {
    const treeData = await window.loadFamilyTreeData();
    chart = createVerticalChart("#chart-container", treeData, printView.enabled ? PRINT_PROFILE : SCREEN_PROFILE);

    if (printView.enabled && printView.autoPrint) {
      await window.triggerAutoPrint();
    }
  } catch (error) {
    console.error("Error building vertical tree:", error);
    window.renderChartError();
  }
})();

function createVerticalChart(containerSelector, treeData, profile) {
  const chartInstance = new d3.OrgChart()
    .container(containerSelector)
    .data(treeData)
    .layout("left")
    .compact(false)
    .nodeWidth(() => profile.cardWidth)
    .nodeHeight((node) => {
      const spouseCount = node.data.spouses ? node.data.spouses.length : 0;
      return profile.cardHeight + spouseCount * (profile.cardHeight + profile.connectorGap);
    })
    .childrenMargin(() => profile.childrenMargin)
    .siblingsMargin(() => profile.siblingMargin)
    .initialZoom(profile.initialZoom)
    .buttonContent(() => "")
    .linkUpdate(function () {
      d3.select(this)
        .attr("stroke", "#64748b")
        .attr("stroke-width", profile.linkWidth);
    })
    .nodeContent((node) => {
      const person = node.data;

      if (person.id === "group_died_young") {
        return createVerticalGroupNodeHtml(person.name, profile);
      }

      let html =
        '<div style="display:flex; flex-direction:column; align-items:center; height:100%; width:100%; box-sizing:border-box;">';
      html += createVerticalCardHtml(person, profile);

      if (person.spouses && person.spouses.length > 0) {
        person.spouses.forEach((spouse) => {
          html += createVerticalConnectorHtml(profile);
          html += createVerticalCardHtml(spouse, profile);
        });
      }

      html += "</div>";
      return html;
    });

  chartInstance.render().expandAll();
  return chartInstance;
}

function createVerticalCardHtml(person, profile) {
  const isFemale = person.gender === "female";
  const backgroundColor = isFemale ? "var(--node-bg-female, #fdf2f8)" : "var(--node-bg-male, #e0f2fe)";
  const borderColor = isFemale ? "var(--node-border-female, #f9a8d4)" : "var(--node-border-male, #7dd3fc)";
  const birthDate = person.birth_date ? `Sinh: ${person.birth_date}` : "Sinh: Khong ro";
  const deathNote = window.getDeathNote(person.notes);
  const deathHtml = deathNote
    ? `<div style="margin-top:3px; font-size:${profile.deathFontSize}px; font-weight:600; line-height:1.25; color:#ef4444; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${deathNote}</div>`
    : "";
  const badgeHtml =
    person.title && !window.isAdoptedTitle(person.title)
      ? `<div style="margin-top:${profile.badgeMarginTop}px; align-self:flex-start; background:rgba(15,23,42,0.06); color:#475569; padding:${profile.badgePadding}; border-radius:999px; font-size:${profile.badgeFontSize}px; line-height:1.2; white-space:nowrap;">${person.title}</div>`
      : "";

  const interactiveAttributes = profile.interactive
    ? `onclick="event.stopPropagation(); window.showModalForId('${person.id}')" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='${profile.hoverShadow}'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='${profile.shadow}'"`
    : "";

  return `
    <div
      ${interactiveAttributes}
      style="cursor:${profile.interactive ? "pointer" : "default"}; background-color:${backgroundColor}; border:1px solid ${borderColor}; border-radius:${profile.cardRadius}px; padding:${profile.cardPadding}; color:#0f172a; font-family:'Inter',sans-serif; flex:0 0 ${profile.cardHeight}px; width:${profile.cardWidth}px; height:${profile.cardHeight}px; display:flex; flex-direction:column; justify-content:flex-start; box-sizing:border-box; box-shadow:${profile.shadow}; transition:${profile.interactive ? "transform 0.2s, box-shadow 0.2s" : "none"};">
      <div style="min-width:0; width:100%; display:flex; flex-direction:column;">
        <div style="font-weight:700; font-size:${profile.nameFontSize}px; line-height:1.3; margin-bottom:${profile.nameGap}px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#0f172a;">
          ${person.name}
        </div>
        <div style="font-size:${profile.metaFontSize}px; line-height:1.3; color:#475569; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          ${birthDate}
        </div>
        ${deathHtml}
        ${badgeHtml}
      </div>
    </div>
  `;
}

function createVerticalConnectorHtml(profile) {
  return `
    <div style="flex:0 0 ${profile.connectorGap}px; width:100%; display:flex; align-items:center; justify-content:center; position:relative;">
      <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;">
        <div style="width:2px; height:100%; background-color:#fda4af;"></div>
      </div>
      <div style="width:${profile.connectorBadgeSize}px; height:${profile.connectorBadgeSize}px; border-radius:999px; background:#ffffff; display:flex; align-items:center; justify-content:center; position:relative; z-index:2; box-shadow:0 0 0 2px rgba(255,255,255,0.95);">
        <svg width="${profile.connectorIconSize}" height="${profile.connectorIconSize}" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.9;">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
    </div>
  `;
}

function createVerticalGroupNodeHtml(name, profile) {
  return `
    <div style="background-color:#fff1f2; border:1px dashed #fb7185; border-radius:${profile.groupRadius}px; padding:${profile.groupPadding}; font-family:'Inter',sans-serif; width:100%; height:100%; box-sizing:border-box; display:flex; align-items:center; justify-content:center; box-shadow:${profile.groupShadow};">
      <div style="font-weight:700; font-size:${profile.badgeFontSize + 3}px; line-height:1.35; color:#be123c; text-align:center;">
        ${name}
      </div>
    </div>
  `;
}
