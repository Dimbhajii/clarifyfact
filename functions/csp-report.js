/**
 * CSP Violation Report Endpoint
 * Receives and logs Content Security Policy violations
 * 
 * This endpoint receives CSP violation reports from browsers and logs them
 * for security monitoring and CSP policy refinement.
 */

// Note: This is used as an Express middleware, not a Firebase Function
// It's imported by functions/index.js and used in the Express app

/**
 * Log CSP violations to console and optionally Firestore
 * POST /api/csp-report or /csp-report
 */
async function handleCSPReport(req, res) {
  // Enable CORS for CSP reporting
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // CSP reports can come in different formats
    let cspReport = req.body;
    
    // Handle Content-Type: application/csp-report format
    if (cspReport && cspReport['csp-report']) {
      cspReport = cspReport['csp-report'];
    }

    // Extract violation details
    const violation = {
      documentURI: cspReport['document-uri'] || cspReport.documentURI,
      violatedDirective: cspReport['violated-directive'] || cspReport.violatedDirective,
      blockedURI: cspReport['blocked-uri'] || cspReport.blockedURI,
      sourceFile: cspReport['source-file'] || cspReport.sourceFile,
      lineNumber: cspReport['line-number'] || cspReport.lineNumber,
      columnNumber: cspReport['column-number'] || cspReport.columnNumber,
      originalPolicy: cspReport['original-policy'] || cspReport.originalPolicy,
      effectiveDirective: cspReport['effective-directive'] || cspReport.effectiveDirective,
      statusCode: cspReport['status-code'] || cspReport.statusCode,
      timestamp: new Date().toISOString(),
      userAgent: req.get('user-agent'),
      ip: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']
    };

    // Log to console for debugging (always log)
    console.warn('🚨 CSP Violation Detected:', JSON.stringify(violation, null, 2));

    // Optionally store in Firestore for long-term monitoring
    // Uncomment the following code if you want to store violations in Firestore
    /*
    try {
      const admin = require('firebase-admin');
      const db = admin.firestore();
      
      await db.collection('csp_violations').add({
        ...violation,
        serverTimestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ CSP violation logged to Firestore');
    } catch (dbError) {
      console.error('❌ Error storing CSP violation in Firestore:', dbError.message);
      // Don't fail the request if logging fails
    }
    */

    // Return 204 No Content (CSP reporting standard)
    // Browsers expect this status code for CSP reports
    res.status(204).end();
  } catch (error) {
    console.error('❌ Error processing CSP report:', error);
    // Always return 204 to avoid breaking CSP reporting
    res.status(204).end();
  }
}

module.exports = handleCSPReport;

