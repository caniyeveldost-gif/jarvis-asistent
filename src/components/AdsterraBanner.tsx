import React, { useRef, useEffect } from 'react';

export const AdsterraBanner: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;

    if (doc) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                background-color: transparent;
                overflow: hidden;
              }
            </style>
          </head>
          <body>
            <script type="text/javascript">
              atOptions = {
                'key' : 'ebb3423019645ee7b10c1c73e0480756',
                'format' : 'iframe',
                'height' : 250,
                'width' : 300,
                'params' : {}
              };
            </script>
            <script type="text/javascript" src="https://www.highperformanceformat.com/ebb3423019645ee7b10c1c73e0480756/invoke.js"></script>
          </body>
        </html>
      `;

      doc.open();
      doc.write(htmlContent);
      doc.close();
    }
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center my-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">
          REKLAM / SPONSOR
        </span>
      </div>
      <div className="relative rounded-xl overflow-hidden border border-cyan-500/20 bg-slate-950/60 p-1 shadow-[0_0_15px_rgba(6,182,212,0.1)] flex items-center justify-center min-h-[250px] min-w-[300px]">
        <iframe
          ref={iframeRef}
          title="Adsterra Advertisement"
          width="300"
          height="250"
          scrolling="no"
          frameBorder="0"
          className="border-0 overflow-hidden"
          style={{ width: '300px', height: '250px' }}
        />
      </div>
    </div>
  );
};
