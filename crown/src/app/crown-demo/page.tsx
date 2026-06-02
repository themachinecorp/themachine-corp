'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function CROWNPage() {
  const [visible, setVisible] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={styles.page}>
      {/* ─── Hero ─── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          {/* Ring Visual */}
          <div className={styles.ringContainer}>
            <div className={styles.ringOuter} />
            <div className={styles.ringMid} />
            <div className={styles.ringInner} />
            <div className={styles.ringCrown} />
            {/* Water shimmer */}
            <div className={styles.waterShimmer} />
            <div className={styles.waterShimmer2} />
          </div>

          <div className={`${styles.heroText} ${visible ? styles.visible : ''}`}>
            {/* Chinese character as main visual */}
            <div className={styles.crownChar}>冠</div>
            <div className={styles.crownSub}>CROW·N</div>
            <div className={styles.tagline}>
              <span className={styles.taglineLine}>Build like Metal.</span>
              <span className={styles.taglineSep}>·</span>
              <span className={styles.taglineLine}>Flow like Water.</span>
            </div>
            <div className={styles.heroDesc}>
              The thinking tool for those who question first.
            </div>
            <div className={styles.heroCta}>
              <a href="#about" className={styles.ctaBtn}>Explore</a>
              <a href="#philosophy" className={styles.ctaBtnGhost}>Philosophy</a>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className={styles.heroFade} />
      </section>

      {/* ─── About ─── */}
      <section className={styles.section} id="about">
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>01 / ABOUT</div>
          <h2 className={styles.sectionTitle}>
            A ring that makes you think.
          </h2>
          <div className={styles.aboutGrid}>
            <div className={styles.aboutLeft}>
              <p className={styles.aboutPara}>
                CROWN is not a watch. It is not a status symbol.
                It is a tool for the mind — designed for those who believe
                the quality of your questions determines the quality of your thinking.
              </p>
              <p className={styles.aboutPara}>
                Built with precision. Worn with intent.
                Every material chosen not for show, but for the weight of presence.
              </p>
            </div>
            <div className={styles.aboutRight}>
              <div className={styles.specList}>
                <div className={styles.specItem}>
                  <span className={styles.specKey}>Material</span>
                  <span className={styles.specVal}>Titanium + Ceramic</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specKey}>Waterproof</span>
                  <span className={styles.specVal}>50m depth</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specKey}>Battery</span>
                  <span className={styles.specVal}>7-day runtime</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specKey}>Weight</span>
                  <span className={styles.specVal}>14g (featherlight)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Philosophy ─── */}
      <section className={styles.sectionDark} id="philosophy">
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>02 / PHILOSOPHY</div>
          <h2 className={styles.sectionTitle}>
            Question first.<br />Think after.
          </h2>
          <div className={styles.philGrid}>
            {[
              {
                num: '01',
                title: 'Metal builds.',
                desc: 'Patience of steel. Craft that takes time because shortcuts produce nothing worth keeping.',
              },
              {
                num: '02',
                title: 'Water flows.',
                desc: 'Speed without force. The river does not fight the canyon — it simply never stops.',
              },
              {
                num: '03',
                title: 'Crown forms.',
                desc: 'Not given. Not taken. Earned through the work of showing up, day after day.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className={styles.philCard}
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className={`${styles.philNum} ${hoveredFeature === i ? styles.active : ''}`}>{item.num}</div>
                <h3 className={styles.philTitle}>{item.title}</h3>
                <p className={styles.philDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.footerCrown}>冠</span>
            <span className={styles.footerName}>CROWN</span>
          </div>
          <div className={styles.footerTagline}>
            Build like Metal. Flow like Water.
          </div>
          <div className={styles.footerMeta}>
            © 2026 THEMATHINK CORP. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}