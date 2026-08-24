  const OWNER = "siamrana2321";
  const REPO = "HUB_Question_Bank";
  const BRANCH = "main";

  const API_ROOT = `https://api.github.com/repos/${OWNER}/${REPO}/contents`;
  const RAW_ROOT = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;

  const app = document.getElementById("app");
  const statusBox = document.getElementById("status");
  const searchInput = document.getElementById("search");

  let semesters = [];
  let currentSemesterPDFs = null;
  let currentSemesterName = null;

  

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setStatus(message) {
    if (message) {
      statusBox.innerHTML = `
        <div class="spinner"></div>
        <span>${escapeHTML(message)}</span>
      `;
      statusBox.style.display = "flex";
    } else {
      statusBox.innerHTML = "";
      statusBox.style.display = "none";
    }
  }

  async function githubContents(path = "") {
    const formattedPath = path ? `/${path}` : "";
    const response = await fetch(`${API_ROOT}${formattedPath}`, {
      headers: {
        "Accept": "application/vnd.github+json"
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return response.json();
  }

  async function loadSemesters() {
    setStatus("Loading question bank...");

    try {
      const items = await githubContents("");

      semesters = items
        .filter(item =>
          item.type === "dir" &&
          /^Semester_\d+$/i.test(item.name)
        )
        .sort((a, b) => {
          const na = parseInt(a.name.match(/\d+/)[0]);
          const nb = parseInt(b.name.match(/\d+/)[0]);
          return na - nb;
        });

      renderSemesters(semesters);

      if (!semesters.length) {
        setStatus("");
        app.innerHTML = `
          <div class="empty">
            <span class="empty-icon">📂</span>
            No semester folders were found.
          </div>
        `;
      }
    } catch (error) {
      setStatus("");
      app.innerHTML = `
        <div class="empty">
          <span class="empty-icon">⚠️</span>
          <strong>Unable to load the Question Bank.</strong><br><br>
          Please check your connection and refresh the page.
        </div>
      `;
      console.error(error);
    }
  }

  function renderSemesters(list) {
    setStatus("");
    currentSemesterPDFs = null;
    currentSemesterName = null;

    if (!list.length) {
      app.innerHTML = `
        <div class="empty">
          <span class="empty-icon">🔍</span>
          No matching semester found.
        </div>
      `;
      return;
    }

    app.innerHTML = `
      <div class="grid">
        ${list.map((item, index) => {
          const number = item.name.match(/\d+/)[0];
          return `
            <div class="semester-card"
                 style="--i: ${index}"
                 onclick="openSemester('${encodeURIComponent(item.name)}')">
              <div class="semester-number">${number}</div>
              <h3>Semester ${number}</h3>
              <p>View available question papers</p>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  async function openSemester(encodedName) {
    const semesterName = decodeURIComponent(encodedName);
    currentSemesterName = semesterName;

    setStatus("Loading question papers...");
    app.innerHTML = "";

    try {
      const items = await githubContents(semesterName);
      const pdfs = [];

      async function collectPDFs(path) {
        const data = await githubContents(path);
        for (const item of data) {
          if (item.type === "file" && /\.pdf$/i.test(item.name)) {
            pdfs.push({
              name: item.name,
              path: item.path
            });
          } else if (item.type === "dir") {
            await collectPDFs(item.path);
          }
        }
      }

      for (const item of items) {
        if (item.type === "file" && /\.pdf$/i.test(item.name)) {
          pdfs.push({
            name: item.name,
            path: item.path
          });
        } else if (item.type === "dir") {
          await collectPDFs(item.path);
        }
      }

      pdfs.sort((a, b) => a.name.localeCompare(b.name));
      currentSemesterPDFs = pdfs;

      renderFiles(semesterName, pdfs);
    } catch (error) {
      setStatus("");
      app.innerHTML = `
        <button class="back" onclick="goHome()"><i class="fa-solid fa-door-open"></i>👈 Back to Semesters</button>
        <div class="empty">
          <span class="empty-icon">⚠️</span>
          Unable to load question papers for this semester.
        </div>
      `;
      console.error(error);
    }
  }

  function renderFiles(semesterName, pdfs) {
    setStatus("");
    const displaySemester = semesterName.replace("_", " ");

    if (!pdfs.length) {
      app.innerHTML = `
        <button class="back" onclick="goHome()"><i class="fa-solid fa-door-open"></i>👈 Back to Semesters</button>
        <h2 class="section-title">${escapeHTML(displaySemester)}</h2>
        <div class="empty">
          <span class="empty-icon">📄</span>
          No PDF question papers are available in this semester yet.
        </div>
      `;
      return;
    }

    app.innerHTML = `
      <button class="back" onclick="goHome()"><i class="fa-solid fa-door-open"></i>👈 Back to Semesters</button>

      <h2 class="section-title">
        ${escapeHTML(displaySemester)}
      </h2>

      <div class="file-list">
        ${pdfs.map((file, index) => {
          const rawURL = `${RAW_ROOT}/${file.path.split("/").map(encodeURIComponent).join("/")}`;
          const viewerURL =`viewer.html?pdf=${encodeURIComponent(rawURL)}&title=${encodeURIComponent(file.name)}`;

          return `
            <div class="file-card" style="--i: ${index}">
              <div class="file-info">
                <span class="file-icon">📄</span>
                <div class="file-details">
                  <div class="file-name">${escapeHTML(file.name)}</div>
                  <div class="file-path">Question Paper</div>
                </div>
              </div>

              <div class="actions">
                <a 
                    class="btn view" 
                    href="${viewerURL}" 
                    target="_parent" 
                    rel="noopener noreferrer"
                    >
                    👁 View
                </a>

                <a
                    class="btn download"
                    href="${rawURL}"
                    download
                    target="_parent"
                    rel="noopener noreferrer"
                    >
                    ⬇ Download
                </a>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function goHome() {
    searchInput.value = "";
    renderSemesters(semesters);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Live search filtering
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();

    if (currentSemesterPDFs !== null) {
      // Searching inside open semester
      const filtered = currentSemesterPDFs.filter(file =>
        file.name.toLowerCase().includes(query)
      );
      renderFiles(currentSemesterName, filtered);
    } else {
      // Searching in semester list
      const filtered = semesters.filter(item => {
        const num = item.name.match(/\d+/)?.[0] || "";
        return item.name.toLowerCase().includes(query) ||
               `semester ${num}`.includes(query) ||
               num === query;
      });
      renderSemesters(filtered);
    }
  });

  loadSemesters();