<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>JEE Advanced Paper Archive</title>
  <style>
    body {
      margin: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: radial-gradient(circle at top, #0f2027, #000000);
      color: #e0f7ff;
    }
    header {
      text-align: center;
      padding: 40px 20px;
      background: linear-gradient(90deg, #00c6ff, #0072ff);
      color: #fff;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    }
    header h1 {
      margin: 0;
      font-size: 2.5rem;
      letter-spacing: 1px;
    }
    header p {
      margin-top: 10px;
      font-size: 1.1rem;
      opacity: 0.9;
    }
    main {
      max-width: 1100px;
      margin: 40px auto;
      padding: 20px;
    }
    .card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(0, 198, 255, 0.3);
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 0 25px rgba(0, 198, 255, 0.15);
      backdrop-filter: blur(8px);
    }
    .card h2 {
      margin-top: 0;
      color: #00eaff;
      letter-spacing: 0.5px;
    }
    .drive-box {
      margin-top: 20px;
      text-align: center;
    }
    .drive-box a {
      display: inline-block;
      padding: 14px 28px;
      border-radius: 30px;
      background: linear-gradient(90deg, #00eaff, #00ff9c);
      color: #000;
      font-weight: bold;
      text-decoration: none;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      box-shadow: 0 0 20px rgba(0,255,200,0.6);
    }
    .drive-box a:hover {
      transform: scale(1.05);
      box-shadow: 0 0 30px rgba(0,255,200,0.9);
    }
    iframe {
      width: 100%;
      height: 600px;
      border: none;
      border-radius: 12px;
      margin-top: 25px;
      background: #000;
    }
    footer {
      text-align: center;
      padding: 20px;
      font-size: 0.95rem;
      color: #9fdfff;
      border-top: 1px solid rgba(0,198,255,0.2);
    }
    @media (max-width: 768px) {
      header h1 {
        font-size: 2rem;
      }
      iframe {
        height: 450px;
      }
    }
  </style>
</head>
<body>

  <header>
    <h1>JEE Advanced Paper Archive (2007–2025)</h1>
    <p>One‑stop robotic‑themed archive for all JEE Advanced question papers</p>
  </header>

  <main>
    <div class="card">
      <h2>📂 Google Drive Paper Repository</h2>
      <p>
        All JEE Advanced papers from <strong>2007 to 2025</strong> are stored in a
        single organized Google Drive folder. You can open the folder directly
        or view the papers inside the embedded viewer below.
      </p>
      <div class="drive-box">
        <!-- Replace the link below with your actual Google Drive folder link -->
        <a href="https://drive.google.com/drive/folders/1-ICMMaRAslTCa35mWOyHIwwSHw3DRwMg?usp=drive_link" target="_blank">
          Open Drive Folder
        </a>
      </div>
    </div>

    <div class="card">
      <h2>🧠 Embedded Paper Viewer</h2>
      <p>
        You can browse and preview the papers directly here without leaving the
        website.
      </p>
      <!-- Replace the src link with your Google Drive *embed* link -->
      <iframe src="https://drive.google.com/embeddedfolderview?id=1-ICMMaRAslTCa35mWOyHIwwSHw3DRwMg#grid"></iframe>
    </div>
  </main>

  <footer>
    Created by <strong>Ayush Verma</strong> | NIT Silchar (CSE)
  </footer>

</body>
</html>
