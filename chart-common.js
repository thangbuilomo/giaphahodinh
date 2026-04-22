let familyTreeDataPromise;

window.globalNodeMap = window.globalNodeMap || new Map();

window.loadFamilyTreeData = async function loadFamilyTreeData() {
  if (familyTreeDataPromise) {
    return familyTreeDataPromise;
  }

  familyTreeDataPromise = (async () => {
    const rawData = await fetch("gia_pha_ho_dinh.json").then((response) => response.json());

    window.globalNodeMap.clear();
    rawData.forEach((person) => window.globalNodeMap.set(person.id, person));

    const chartData = rawData.map((person) => {
      const spouses = [];

      if (person.pids && person.pids.length > 0) {
        person.pids.forEach((spouseId) => {
          if (window.globalNodeMap.has(spouseId)) {
            spouses.push(window.globalNodeMap.get(spouseId));
          }
        });
      }

      return {
        ...person,
        parentId: person.pid || "",
        spouses,
      };
    });

    const spouseIdsAsJoiners = new Set();
    chartData.forEach((person) => {
      if (person.parentId === "" && person.pids && person.pids.length > 0) {
        person.pids.forEach((spouseId) => {
          const partner = window.globalNodeMap.get(spouseId);
          if (partner && (partner.pid !== "" || partner.id === "1")) {
            if (person.id !== "1") {
              spouseIdsAsJoiners.add(person.id);
            }
          }
        });
      }
    });

    const finalTreeData = chartData.filter((person) => !spouseIdsAsJoiners.has(person.id));

    const diedYoungIds = new Set(["15", "16", "17", "41", "42"]);
    let hasDiedYoungGroup = false;

    finalTreeData.forEach((person) => {
      if (diedYoungIds.has(person.id)) {
        person.parentId = "group_died_young";
        hasDiedYoungGroup = true;
      }
    });

    if (hasDiedYoungGroup) {
      finalTreeData.push({
        id: "group_died_young",
        parentId: "1",
        name: "Các con mất khi nhỏ",
        gender: "male",
        birth_date: "9900",
        title: "",
        spouses: [],
      });
    }

    const explicitOrder = {
      "3": 1,
      "18": 2,
      "31": 3,
      "43": 4,
      "60": 5,
      group_died_young: 6,
    };

    finalTreeData.sort((left, right) => getSortValue(left, explicitOrder) - getSortValue(right, explicitOrder));

    return finalTreeData;
  })();

  return familyTreeDataPromise;
};

window.getDeathNote = function getDeathNote(notes) {
  if (!notes) {
    return "";
  }

  const match = notes.match(/(Mất:.*)/i);
  return match ? match[1].trim() : "";
};

window.applyDefaultLinkStyle = function applyDefaultLinkStyle() {
  d3.select(this)
    .attr("stroke", "#64748b")
    .attr("stroke-width", 2);
};

window.renderChartError = function renderChartError() {
  const container = document.getElementById("chart-container");
  if (!container) {
    return;
  }

  container.innerHTML = '<p style="color:#b91c1c; margin:2rem; font-family:Inter,sans-serif;">Không tải được dữ liệu. Hãy chạy localhost trước.</p>';
};

window.bindChartControls = function bindChartControls(getChart) {
  const fitButton = document.getElementById("btn-fit");
  const expandButton = document.getElementById("btn-expand");
  const collapseButton = document.getElementById("btn-collapse");

  if (!fitButton || fitButton.dataset.bound === "true") {
    return;
  }

  const runIfReady = (action) => {
    const chart = getChart();
    if (!chart) {
      return;
    }
    action(chart);
  };

  fitButton.dataset.bound = "true";
  fitButton.addEventListener("click", () => runIfReady((chart) => chart.fit()));

  if (expandButton) {
    expandButton.addEventListener("click", () => runIfReady((chart) => chart.expandAll().fit()));
  }

  if (collapseButton) {
    collapseButton.addEventListener("click", () => runIfReady((chart) => chart.collapseAll().fit()));
  }
};

window.bindPdfExportButton = function bindPdfExportButton(getChart, options = {}) {
  const exportButton = document.getElementById("btn-pdf");

  if (!exportButton || exportButton.dataset.bound === "true") {
    return;
  }

  exportButton.dataset.bound = "true";
  exportButton.addEventListener("click", async () => {
    const chart = getChart();
    if (!chart) {
      return;
    }

    if (!window.html2canvas || !window.jspdf) {
      window.alert("Thiếu thư viện xuất PDF trong trang.");
      return;
    }

    const wrapper = document.querySelector(".chart-wrapper");
    if (!wrapper) {
      return;
    }

    const originalLabel = exportButton.textContent;
    exportButton.disabled = true;
    exportButton.textContent = "Đang xuất...";

    try {
      chart.fit();
      await wait(350);

      const bgColor = getComputedStyle(document.documentElement).getPropertyValue("--bg-color").trim() || "#fdfbf7";
      const canvas = await window.html2canvas(wrapper, {
        backgroundColor: bgColor,
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const { jsPDF } = window.jspdf;
      const orientation = canvas.width > canvas.height ? "landscape" : "portrait";
      const pdf = new jsPDF({
        orientation,
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;
      const imageData = canvas.toDataURL("image/png");
      const imageHeight = (canvas.height * usableWidth) / canvas.width;
      let remainingHeight = imageHeight;

      pdf.addImage(imageData, "PNG", margin, margin, usableWidth, imageHeight, undefined, "FAST");
      remainingHeight -= usableHeight;

      while (remainingHeight > 0) {
        const position = remainingHeight - imageHeight + margin;
        pdf.addPage();
        pdf.addImage(imageData, "PNG", margin, position, usableWidth, imageHeight, undefined, "FAST");
        remainingHeight -= usableHeight;
      }

      const prefix = options.filenamePrefix || "gia-pha";
      pdf.save(`${prefix}-${formatDateForFileName(new Date())}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      window.alert("Không xuất được PDF. Hãy thử lại sau.");
    } finally {
      exportButton.disabled = false;
      exportButton.textContent = originalLabel;
    }
  });
};

window.initPersonModal = function initPersonModal() {
  const modal = document.getElementById("detail-modal");
  const closeButton = document.querySelector(".close-btn");

  if (!modal || !closeButton || modal.dataset.bound === "true") {
    return;
  }

  const showModal = (person) => {
    document.getElementById("modal-name").textContent = person.name || "Không rõ";
    document.getElementById("modal-title").textContent =
      person.title || (person.gender === "female" ? "Nữ giới" : "Nam giới");
    document.getElementById("modal-birth").textContent = person.birth_date || "Không có thông tin";
    document.getElementById("modal-hometown").textContent = person.hometown || "Không có thông tin";
    document.getElementById("modal-notes").innerHTML = person.notes || "";

    const initials = person.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2) || "?";
    document.getElementById("modal-avatar").textContent = initials;

    let spouseText = "Không có";
    if (person.pids && person.pids.length > 0) {
      spouseText = person.pids
        .map((spouseId) => {
          const spouse = window.globalNodeMap.get(spouseId);
          return spouse ? spouse.name : "";
        })
        .filter(Boolean)
        .join(", ");
    }
    document.getElementById("modal-spouses").textContent = spouseText;

    modal.classList.remove("hidden");
  };

  window.showModalForId = (id) => {
    const person = window.globalNodeMap.get(id);
    if (person) {
      showModal(person);
    }
  };

  closeButton.addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.add("hidden");
    }
  });

  modal.dataset.bound = "true";
};

function parseDateForSort(dateStr) {
  if (!dateStr || dateStr.trim() === "") {
    return 99999999;
  }

  const normalized = dateStr.replace(/\s/g, "");
  const parts = normalized.includes("/") ? normalized.split("/") : normalized.split("-");

  if (parts.length === 1) {
    const year = parseInt(parts[0], 10);
    return Number.isNaN(year) ? 99999999 : year * 10000;
  }

  if (parts.length === 3) {
    const day = parseInt(parts[0], 10) || 1;
    const month = parseInt(parts[1], 10) || 1;
    const year = parseInt(parts[2], 10);
    return Number.isNaN(year) ? 99999999 : year * 10000 + month * 100 + day;
  }

  return 99999999;
}

function getSortValue(person, explicitOrder) {
  if (person.title && person.title.toLowerCase().includes("con nuôi")) {
    return 99999;
  }

  if (person.parentId === "1" && explicitOrder[person.id]) {
    return explicitOrder[person.id] * 1000;
  }

  return parseDateForSort(person.birth_date);
}

function formatDateForFileName(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}${month}${day}-${hour}${minute}`;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
