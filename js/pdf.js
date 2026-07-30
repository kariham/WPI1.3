/* =====================================================================
   QHSE_PDF — genereert een professioneel PDF-rapport met jsPDF.
   Vereist: jspdf + jspdf-autotable (via CDN, zie index.html) en
   js/logo.js (QHSE_LOGO / QHSE_LOGO_ASPECT).
   ===================================================================== */
const QHSE_PDF = (() => {

  const MARGIN = 40;
  const MM = 2.83465; // pt per mm
  const PHOTO_H = 60 * MM;     // vaste foto-hoogte: 60mm
  const PHOTO_GAP = 8;         // ruimte tussen foto's
  const PHOTOS_PER_ROW = 3;    // max. 3 foto's naast elkaar over de breedte

  async function build(insp, cl) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - MARGIN * 2;

    let y = drawFirstPageHeader(doc, cl, pageWidth);

    // --- Gegevens (in een kader, grotere letters, ingevulde waarden in blauw) ---
    y = await drawMetaBox(doc, cl, insp, contentWidth, y);

    // --- Slangen (indien aanwezig) ---
    const hosesField = cl.meta.find(f => f.type === 'hoses');
    if (hosesField) {
      const hoses = insp.meta[hosesField.id] || [];
      if (hoses.length) {
        y += 4;
        y = ensureSpace(doc, y, 14, cl);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
        doc.text('Gebruikte slangen', MARGIN, y); y += 12;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
        for (const h of hoses) {
          const status = h.keuring === 'ok' ? 'gekeurd OK' : h.keuring === 'nok' ? 'NIET CONFORM' : 'onbekend';
          y = ensureSpace(doc, y, 12, cl);
          if (h.keuring === 'nok') doc.setTextColor(198, 40, 40); else doc.setTextColor(0);
          doc.text(`• ${h.naam || 'slang'} — cert. ${h.cert || '-'} (${status})`, MARGIN + 6, y);
          doc.setTextColor(0);
          y += 11;
          if (h.keuring === 'nok' && h.note) {
            const nl = doc.splitTextToSize(`Opmerking: ${h.note}`, contentWidth - 20);
            y = ensureSpace(doc, y, nl.length * 10, cl);
            doc.setFont('helvetica', 'italic'); doc.setTextColor(90);
            doc.text(nl, MARGIN + 14, y);
            doc.setFont('helvetica', 'normal'); doc.setTextColor(0);
            y += nl.length * 10 + 2;
          }
          if (h.keuring === 'nok' && h.photos && h.photos.length) {
            const hosePhotoW = (contentWidth - 14 - (PHOTOS_PER_ROW - 1) * PHOTO_GAP) / PHOTOS_PER_ROW;
            y = ensureSpace(doc, y, PHOTO_H + 10, cl);
            let x = MARGIN + 14;
            let count = 0;
            for (const pid of h.photos) {
              const url = await QHSE_DB.getPhoto(pid);
              if (url) {
                if (count > 0 && count % PHOTOS_PER_ROW === 0) { x = MARGIN + 14; y += PHOTO_H + PHOTO_GAP; y = ensureSpace(doc, y, PHOTO_H + 10, cl); }
                try { doc.addImage(url, 'JPEG', x, y, hosePhotoW, PHOTO_H); } catch (e) {}
                x += hosePhotoW + PHOTO_GAP;
                count++;
              }
            }
            y += PHOTO_H + 12;
          }
        }
        y += 6;
      }
    }

    // --- Vragen per sectie (blok-layout: vraag → status → opmerking → foto) ---
    for (const sec of cl.sections) {
      y = ensureSpace(doc, y, 26, cl);
      doc.setFillColor(240, 241, 240);
      doc.rect(MARGIN, y - 10, contentWidth, 16, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(30, 30, 30);
      doc.text(sec.name, MARGIN + 4, y + 2);
      doc.setTextColor(0);
      y += 20;

      for (const q of sec.questions) {
        const a = insp.answers[q.id] || {};
        y = await drawQuestionBlock(doc, q, a, contentWidth, y, cl);
      }
    }

    // --- Steekproeftabellen ---
    if (cl.sample) {
      y = ensureSpace(doc, y, 40, cl);
      const headers = cl.sampleFields.map(f => f.label);
      const rows = (insp.samples || []).map(s => cl.sampleFields.map(f => s[f.id] || '-'));
      y = autoTableSection(doc, cl.sampleTitle, headers, rows, y, cl);
    }
    if (cl.sample2) {
      y = ensureSpace(doc, y, 40, cl);
      const headers = cl.sample2Fields.map(f => f.label);
      const rows = (insp.samples2 || []).map(s => cl.sample2Fields.map(f => s[f.id] || '-'));
      y = autoTableSection(doc, cl.sample2Title, headers, rows, y, cl);
    }

    // --- Handtekening ---
    if (insp.signature) {
      y = ensureSpace(doc, y, 110, cl);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(0);
      doc.text('Handtekening inspecteur', MARGIN, y);
      y += 8;
      try { doc.addImage(insp.signature, 'PNG', MARGIN, y, 180, 65); } catch (e) {}
      y += 75;
    }

    // --- Samenvatting van alle NOK-opmerkingen (nummer + opmerking) ---
    const nokRows = [];
    for (const sec of cl.sections) {
      for (const q of sec.questions) {
        const a = insp.answers[q.id] || {};
        if (a.status === 'NOK') nokRows.push([q.num || '-', a.note || '-']);
      }
    }
    if (nokRows.length) {
      y = ensureSpace(doc, y, 40, cl);
      y = autoTableSection(doc, 'Samenvatting opmerkingen NOK', ['Vraag', 'Opmerking'], nokRows, y, cl);
    }

    // --- Footer / paginanummers op alle pagina's ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(120);
      doc.text(
        `${cl.docControl.code} · gegenereerd op ${new Date().toLocaleString('nl-BE')} · pagina ${i}/${pageCount}`,
        MARGIN, doc.internal.pageSize.getHeight() - 20
      );
      doc.setTextColor(0);
    }

    return doc.output('blob');
  }

  /* -------------------------------------------------------------------
     "Gegevens"-kader: volle breedte, groter lettertype, ingevulde
     waarden in blauw — professionele, direct leesbare koptabel.
  ------------------------------------------------------------------- */
  async function drawMetaBox(doc, cl, insp, contentWidth, y) {
    const labelSize = 10.5, lineHeight = 17, padding = 12;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(0);
    y = ensureSpace(doc, y, 20, cl);
    doc.text('Gegevens', MARGIN, y);
    y += 8;

    // Bereken vooraf hoeveel regels elk veld nodig heeft (waarden kunnen wrappen)
    const fields = cl.meta.filter(f => f.type !== 'hoses');
    doc.setFontSize(labelSize);
    const rows = fields.map(f => {
      let val = insp.meta[f.id];
      if (Array.isArray(val)) val = val.join(', ');
      val = val || '-';
      const labelText = f.label + ':  ';
      doc.setFont('helvetica', 'bold');
      const labelW = doc.getTextWidth(labelText);
      doc.setFont('helvetica', 'normal');
      const valueLines = doc.splitTextToSize(String(val), contentWidth - padding * 2 - labelW);
      return { labelText, labelW, valueLines };
    });
    const totalLines = rows.reduce((sum, r) => sum + r.valueLines.length, 0);
    const boxHeight = totalLines * lineHeight + padding * 2;

    y = ensureSpace(doc, y, boxHeight + 10, cl);
    const boxTop = y;
    doc.setDrawColor(170); doc.setLineWidth(0.75);
    doc.rect(MARGIN, boxTop, contentWidth, boxHeight);

    let ly = boxTop + padding + labelSize - 1;
    doc.setFontSize(labelSize);
    for (const r of rows) {
      doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
      doc.text(r.labelText, MARGIN + padding, ly);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 70, 200); // blauw voor ingevulde waarden
      doc.text(r.valueLines, MARGIN + padding + r.labelW, ly);
      ly += r.valueLines.length * lineHeight;
    }
    doc.setTextColor(0); doc.setDrawColor(0);
    return boxTop + boxHeight + 22;
  }


  async function drawQuestionBlock(doc, q, a, contentWidth, y, cl) {
    y = ensureSpace(doc, y, 40, cl);

    let x = MARGIN;
    doc.setFontSize(9);
    if (q.num) {
      doc.setFont('helvetica', 'bold');
      const numTxt = q.num + '.';
      doc.text(numTxt, x, y);
      x += doc.getTextWidth(numTxt) + 5;
    }
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(q.text, MARGIN + contentWidth - x);
    doc.text(lines, x, y);
    y += lines.length * 11;

    if (q.hint) {
      const hl = doc.splitTextToSize(q.hint, contentWidth - 4);
      y = ensureSpace(doc, y, hl.length * 9, cl);
      doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(120);
      doc.text(hl, MARGIN, y);
      doc.setTextColor(0); doc.setFont('helvetica', 'normal');
      y += hl.length * 9 + 2;
    }

    y = ensureSpace(doc, y, 14, cl);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    const statusColor = a.status === 'NOK' ? [198, 40, 40] : a.status === 'OK' ? [46, 125, 70] : [130, 130, 130];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(`Status: ${a.status || '—'}`, MARGIN, y);
    doc.setTextColor(0);
    y += 12;

    if (a.checks && a.checks.length) {
      const cLines = doc.splitTextToSize(`Aangeduid: ${a.checks.join(', ')}`, contentWidth);
      y = ensureSpace(doc, y, cLines.length * 10, cl);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
      doc.text(cLines, MARGIN, y);
      y += cLines.length * 10 + 2;
    }

    if (a.note) {
      const nLines = doc.splitTextToSize(`Opmerking: ${a.note}`, contentWidth);
      y = ensureSpace(doc, y, nLines.length * 10, cl);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(70);
      doc.text(nLines, MARGIN, y);
      doc.setTextColor(0);
      y += nLines.length * 10 + 3;
    }

    if (a.photos && a.photos.length) {
      const photoW = (contentWidth - (PHOTOS_PER_ROW - 1) * PHOTO_GAP) / PHOTOS_PER_ROW;
      y = ensureSpace(doc, y, PHOTO_H + 10, cl);
      let x2 = MARGIN;
      let count = 0;
      for (const pid of a.photos) {
        const dataUrl = await QHSE_DB.getPhoto(pid);
        if (dataUrl) {
          if (count > 0 && count % PHOTOS_PER_ROW === 0) { x2 = MARGIN; y += PHOTO_H + PHOTO_GAP; y = ensureSpace(doc, y, PHOTO_H + 10, cl); }
          try { doc.addImage(dataUrl, 'JPEG', x2, y, photoW, PHOTO_H); } catch (e) {}
          x2 += photoW + PHOTO_GAP;
          count++;
        }
      }
      y += PHOTO_H + 12;
    }

    y = ensureSpace(doc, y, 10, cl);
    doc.setDrawColor(228); doc.line(MARGIN, y, MARGIN + contentWidth, y); doc.setDrawColor(0);
    y += 12;
    return y;
  }

  /* -------------------------------------------------------------------
     Steekproeftabel (autotable) met titel erboven.
  ------------------------------------------------------------------- */
  function autoTableSection(doc, title, headers, rows, startY, cl) {
    const startPageNum = doc.internal.getNumberOfPages();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(0);
    doc.text(title, MARGIN, startY);
    doc.autoTable({
      head: [headers],
      body: rows.length ? rows : [headers.map(() => '-')],
      startY: startY + 8,
      margin: { left: MARGIN, right: MARGIN, top: 70 },
      styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { fillColor: [50, 50, 50] },
      didDrawPage: () => {
        if (doc.internal.getNumberOfPages() > startPageNum) drawRunningHeader(doc, cl);
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.cell.raw === 'NOK') {
          data.cell.styles.textColor = [180, 30, 30];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });
    return doc.lastAutoTable.finalY + 20;
  }

  /* -------------------------------------------------------------------
     Paginabeheer: als de resterende ruimte niet volstaat, nieuwe pagina
     + doorlopende (kleine) koptekst tekenen, en de nieuwe y teruggeven.
  ------------------------------------------------------------------- */
  function ensureSpace(doc, y, needed, cl) {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + needed > pageHeight - 40) {
      doc.addPage();
      return drawRunningHeader(doc, cl);
    }
    return y;
  }

  /* -------------------------------------------------------------------
     Volledige documentkop — enkel op pagina 1: logo, titel/documentcode
     en het documentbeheer-kadertje (naam, revisie, versie, beheerder).
  ------------------------------------------------------------------- */
  function drawFirstPageHeader(doc, cl, pageWidth) {
    const top = 30;
    const boxH = 78;
    const colAw = 150;
    const colCw = 130;
    const colBw = (pageWidth - MARGIN * 2) - colAw - colCw;
    const xA = MARGIN, xB = MARGIN + colAw, xC = MARGIN + colAw + colBw;
    const dc = cl.docControl || {};

    doc.setDrawColor(180); doc.setLineWidth(0.75);
    doc.rect(MARGIN, top, pageWidth - MARGIN * 2, boxH);
    doc.line(xB, top, xB, top + boxH);
    doc.line(xC, top, xC, top + boxH);
    doc.line(xA + 50, top, xA + 50, top + boxH);

    const rows = [['Naam', dc.naam], ['Rev.', dc.rev], ['Versie', dc.versie], ['Beheerder', dc.beheerder]];
    const rowH = boxH / rows.length;
    rows.forEach((r, i) => {
      const ry = top + i * rowH;
      if (i > 0) doc.line(xA, ry, xB, ry);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(0);
      doc.text(String(r[0]), xA + 4, ry + rowH / 2 + 3);
      doc.setFont('helvetica', 'normal');
      doc.text(String(r[1] || '-'), xA + 54, ry + rowH / 2 + 3);
    });

    doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
    doc.text(String(dc.code || ''), xB + colBw / 2, top + 30, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    const titleLines = doc.splitTextToSize(String(dc.docTitle || cl.title), colBw - 16);
    doc.text(titleLines, xB + colBw / 2, top + 46, { align: 'center' });

    const logoW = colCw - 16;
    const logoH = logoW / (typeof QHSE_LOGO_ASPECT !== 'undefined' ? QHSE_LOGO_ASPECT : 2.5);
    const logoY = top + (boxH - logoH) / 2;
    if (typeof QHSE_LOGO !== 'undefined') {
      try { doc.addImage(QHSE_LOGO, 'PNG', xC + 8, logoY, logoW, logoH); } catch (e) {}
    }

    doc.setDrawColor(0); doc.setTextColor(0);
    return top + boxH + 24;
  }

  /* -------------------------------------------------------------------
     Slanke doorlopende koptekst — op alle volgende pagina's.
  ------------------------------------------------------------------- */
  function drawRunningHeader(doc, cl) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const dc = cl.docControl || {};
    const logoW = 62;
    const logoH = logoW / (typeof QHSE_LOGO_ASPECT !== 'undefined' ? QHSE_LOGO_ASPECT : 2.5);
    if (typeof QHSE_LOGO !== 'undefined') {
      try { doc.addImage(QHSE_LOGO, 'PNG', MARGIN, 18, logoW, logoH); } catch (e) {}
    }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(0);
    doc.text(`${dc.code || ''} — ${dc.docTitle || cl.title}`, pageWidth - MARGIN, 18 + logoH / 2 + 3, { align: 'right' });
    doc.setDrawColor(210);
    doc.line(MARGIN, 18 + logoH + 8, pageWidth - MARGIN, 18 + logoH + 8);
    doc.setDrawColor(0);
    return 18 + logoH + 26;
  }

  return { build };
})();
