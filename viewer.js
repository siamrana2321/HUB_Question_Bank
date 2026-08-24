

  import * as pdfjsLib from
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";


  /*
   * PDF.js worker
   */

  pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";


  /*
   * Get URL parameters
   */

  const params =
    new URLSearchParams(window.location.search);

  const pdfURL =
    params.get("pdf");

  const title =
    params.get("title");


  /*
   * Set title
   */

  if (title) {

    document.getElementById("viewer-title").textContent =
      title;

    document.title =
      title + " - HUB CSE Question Bank";

  }


  /*
   * PDF container
   */

  const container =
    document.getElementById("pdf-container");


  const loading =
    document.getElementById("loading");


  /*
   * BACK TO QUESTION BANK
   */

  function goHome() {

    window.location.href = "questionbank.html";

  }


  /*
   * Load PDF
   */

  async function loadPDF() {

    try {

      if (!pdfURL) {

        throw new Error("PDF URL missing.");

      }


      const pdf =
        await pdfjsLib
          .getDocument(pdfURL)
          .promise;


      /*
       * Remove loading message
       */

      loading.remove();


      /*
       * Render every page
       */

      for (
        let pageNumber = 1;
        pageNumber <= pdf.numPages;
        pageNumber++
      ) {


        const page =
          await pdf.getPage(pageNumber);


        /*
         * Mobile + Desktop quality
         */

        const scale =
          window.innerWidth < 600
            ? 1.35
            : 1.7;


        const viewport =
          page.getViewport({
            scale: scale
          });


        /*
         * Page wrapper
         */

        const pageBox =
          document.createElement("div");

        pageBox.className =
          "pdf-page";


        /*
         * Canvas
         */

        const canvas =
          document.createElement("canvas");


        const context =
          canvas.getContext("2d");


        canvas.width =
          viewport.width;

        canvas.height =
          viewport.height;


        pageBox.appendChild(canvas);

        container.appendChild(pageBox);


        /*
         * Render page
         */

        await page.render({

          canvasContext: context,

          viewport: viewport

        }).promise;

      }

    }


    catch (error) {

      console.error(error);


      /*
       * Remove loading message
       */

      if (loading) {

        loading.remove();

      }


      /*
       * Show error message + Back button
       */

      container.innerHTML = `

        <div class="error">

          <button
            class="back-btn"
            onclick="goHome()">

            <i class="fa-solid fa-door-open"></i>

            Back to Question Bank

          </button>


          <h3>
            ⚠️ Unable to load question paper
          </h3>


          <p>
            Please refresh the page and try again.
          </p>

        </div>

      `;

    }

  }


  /*
   * Make goHome() available to HTML onclick
   */

  window.goHome = goHome;


  /*
   * Start PDF loading
   */

  loadPDF();
