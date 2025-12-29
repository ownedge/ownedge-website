<template>
  <div class="section-content animate-in">
    <h3> Hi, we're OWNEDGE - EST 2011</h3>
    
    <div class="manifesto-wrapper">
      <div class="manifesto-content">
        <p class="highlight">Ownedge was created from a simple idea: that the most meaningful work happens when you care deeply about what you build — and when you choose to stand behind it.</p>
        
        <p>We live in a world full of fast launches, disposable products, and short-term thinking. Ownedge exists as a quiet counterweight to that. It is a place to build deliberately and with craftsmanship — whether that means software, infrastructure, products, or real-world assets.</p>
        
        <p>At its core, Ownedge is about ownership in the deepest sense: not just legal ownership, but intellectual ownership, responsibility, and pride in what exists because you made it.</p>
        
        <p>We design systems the way artisans shape objects: with attention to structure, balance, and longevity. </p>

        <p>Our work is not about chasing trends. — <span>We set the trends.</span></p>
      </div>

      <div class="ceo-profile">
        <div class="photo-frame">
          <img src="../../assets/juca.png" alt="CEO" class="ceo-photo" />
          <div class="frame-label">CEO.IMG</div>
        </div>
        <div class="signature">
          <div class="signature-line">P/CATALÃO</div>
          <div class="signature-title">OWNER</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-content h3 {
    margin-top: 0;
    color: var(--color-accent);
    border-bottom: 1px solid rgba(64, 224, 208, 0.3);
    display: inline-block;
    padding-bottom: 5px;
    margin-bottom: 25px;
    font-size: 1.2rem;
    letter-spacing: 2px;
}

.manifesto-wrapper {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 40px;
    align-items: start;
}

.manifesto-content {
    max-width: 900px;
}

.manifesto-content p {
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.85);
    font-size: 1.2rem;
    margin-bottom: 20px;
}

.manifesto-content p.highlight {
    color: #fff;
    font-size: 1.35rem;
    font-weight: 500;
    line-height: 1.5;
    border-left: 3px solid var(--color-accent);
    padding-left: 20px;
    margin-bottom: 30px;
}

.trend-statement {
    margin-top: 40px;
    padding: 25px;
    background: rgba(64, 224, 208, 0.05);
    border-left: 4px solid var(--color-accent);
    font-size: 1.3rem;
    color: #fff;
    letter-spacing: 1px;
    max-width: fit-content;
}

.trend-statement span {
    color: var(--color-accent);
    font-weight: bold;
    text-transform: uppercase;
}

/* CEO Profile */
.ceo-profile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding-top: 20px;
}

.photo-frame {
    padding: 10px;
    background: #111;
    border: 1px solid #444;
    position: relative;
    box-shadow: 10px 10px 0px rgba(0,0,0,0.3);
}

.photo-frame::before {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    width: 10px;
    height: 10px;
    border-top: 2px solid var(--color-accent);
    border-left: 2px solid var(--color-accent);
}

.ceo-photo {
    width: 220px;
    height: auto;
    filter: grayscale(1) contrast(1.5);
    display: block;
    mix-blend-mode: screen;
    opacity: 0.9;
}

.frame-label {
    position: absolute;
    bottom: -8px;
    right: 10px;
    background: #000;
    padding: 0 5px;
    font-size: 0.7rem;
    color: #666;
    letter-spacing: 1px;
}

.signature {
    text-align: right;
    width: 100%;
    padding-right: 20px;
}

.signature-line {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.4rem;
    color: #fff;
    font-style: italic;
    letter-spacing: -1px;
    margin-bottom: 5px;
}

.signature-title {
    font-size: 0.7rem;
    color: var(--color-accent);
    letter-spacing: 2px;
}

.animate-in {
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1024px) {
    .manifesto-wrapper {
        grid-template-columns: 1fr;
    }
    
    .ceo-profile {
        align-items: flex-start;
    }
    
    .signature {
        text-align: left;
    }
}

@media (max-width: 768px) {
    .trend-statement {
        font-size: 1.1rem;
    }
}
</style>
