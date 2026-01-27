// English translations
export default {
    // App
    app: {
        title: 'Toolbox',
        switchToLight: 'Switch to light mode',
        switchToDark: 'Switch to dark mode',
        lightMode: '🌞 Light',
        darkMode: '🌙 Dark',
        scrollToTop: 'Scroll to top',
        tabs: {
            timestamp: 'Timestamp',
            diff: 'String Diff',
            coord: 'Coordinates',
            ip: 'IP Lookup'
        }
    },

    // TimestampTool
    timestamp: {
        title: 'Timestamp Converter',
        currentTime: 'Current Time',
        realTimeDisplay: 'Real-time display of current time',
        epochToDate: 'Timestamp to Date',
        dateToEpoch: 'Date to Timestamp',
        convert: 'Convert',
        copy: 'Copy',
        stop: 'Stop',
        start: 'Start',
        result: 'Result',
        formatError: 'Format error',
        formatExample: 'Format error, example: 2025-09-13 11:19:55',
        milliseconds: 'Milliseconds(ms)',
        seconds: 'Seconds(s)',
        timestampHint: 'Treats input as local timezone and converts to millisecond timestamp'
    },

    // StringDiffTool
    diff: {
        title: 'String Comparison & Manual Merge',
        startCompare: 'Compare',
        cancelProcess: 'Cancel',
        copyMerged: 'Copy Merged Result',
        clearAll: 'Clear All',
        originalString: 'Original String',
        compareString: 'Compare String',
        pasteLeft: 'Paste the original string here',
        pasteRight: 'Paste the comparison string here',
        characters: 'characters',
        overallView: '📊 Comparison View',
        leftOriginal: 'Original String (Left)',
        rightCompare: 'Compare String (Right)',
        clickToSelect: 'Click to select',
        leftContent: 'left',
        rightContent: 'right',
        content: 'content',
        quickSelect: '🎯 Quick Select',
        selectAllLeft: 'Select All Left',
        selectAllRight: 'Select All Right',
        mergedResult: 'Merged Result (Editable)',
        copyResult: '📋 Copy Result',
        clearResult: '🗑️ Clear Result',
        resultPlaceholder: 'Merged result will appear here...',
        processingLarge: 'Processing large text with hybrid strategy (line + character level)...',
        processingMedium: 'Processing medium text with optimized algorithm...',
        processing: 'Processing text comparison...',
        buildingGroups: 'Building diff groups...',
        processError: 'An error occurred during processing. The text may be too large. Please try with smaller text.'
    },

    // CoordinateTool
    coord: {
        title: 'Coordinate Converter',
        clear: 'Clear',
        sourceCoord: 'Source Coordinates',
        longitude: 'Longitude',
        latitude: 'Latitude',
        targetCoordSys: 'Target Coordinate System',
        convert: 'Convert',
        result: 'Result',
        lngResult: 'Longitude result',
        latResult: 'Latitude result',
        copy: 'Copy',
        validCoordError: 'Please enter valid coordinates',
        rangeError: 'Coordinate range error',
        rangeHint: 'Longitude[-180,180], Latitude[-90,90]',
        convertFailed: 'Conversion failed',

        // Batch convert
        batchTitle: 'Batch Convert',
        batchConvert: 'Batch Convert',
        copyResult: 'Copy Result',
        batchInputHint: 'Input coordinates (one per line, format: longitude,latitude)',
        formatError: 'Format error',
        invalidCoord: 'Invalid coordinates',
        sourceCoordSys: 'Source:',
        targetCoordSysLabel: 'Target:',

        // Distance calculator
        distanceTitle: '📏 Distance Calculator',
        distanceWarning: '⚠️ Important:',
        distanceWarningText: 'Both points must use the same coordinate system!',
        distanceWarningDetail1: '• Using different coordinate systems (e.g., WGS84 vs GCJ02) will cause significant errors (possibly hundreds of meters)',
        distanceWarningDetail2: '• Please convert coordinates to the same system using the converter above before calculating distance',
        distanceWarningDetail3: '• Distance calculation is coordinate-system agnostic as long as both points use the same system',
        point1: 'Point 1 Coordinates',
        point2: 'Point 2 Coordinates',
        calculate: 'Calculate Distance',
        preciseCalc: '🎯 Precise (Haversine)',
        fastCalc: '⚡ Fast Estimate (Planar)',
        distanceResult: 'Distance result',
        preciseHint: 'Spherical trigonometry calculation, suitable for any distance',
        fastHint: 'Planar geometry calculation, suitable for short distances within hundreds of km',
        algorithmExplain: '💡 Algorithm Notes:',
        haversineExplain: '• Haversine formula: Considers Earth\'s curvature for accurate spherical distance',
        flatExplain: '• Planar approximation: Treats local Earth as flat, uses Pythagorean theorem',
        shortDistanceHint: '• For distances within tens of km, both methods give very similar results',
        longDistanceHint: '• For longer distances, planar approximation has slightly larger error (still acceptable)',
        meters: 'meters',
        kilometers: 'km',

        // Coordinate systems
        coordSysTitle: '📍 Coordinate Systems Explained',
        wgs84Title: '🌍 WGS84 (World Geodetic System 1984)',
        wgs84Desc1: '• International standard GPS coordinate system, globally used',
        wgs84Desc2: '• Used by: Google Maps, OpenStreetMap, GPS devices, international map services',
        wgs84Desc3: '• Feature: True geographic coordinates, no offset encryption',
        gcj02Title: '🇨🇳 GCJ02 (China Geodetic Coordinate System)',
        gcj02Desc1: '• Encrypted coordinate system by China\'s State Bureau of Surveying, aka "Mars Coordinates"',
        gcj02Desc2: '• Used by: Amap, Tencent Maps, Apple Maps (China), Google Maps (China)',
        gcj02Desc3: '• Feature: Offset encryption on WGS84 for national geographic security',
        bd09Title: '🅱️ BD09 (Baidu 09 Coordinate System)',
        bd09Desc1: '• Baidu\'s additional encryption layer on top of GCJ02',
        bd09Desc2: '• Used by: Baidu Maps, Baidu API services',
        bd09Desc3: '• Feature: Double encryption, Baidu products only',
        usageTips: '💡 Usage Tips:',
        usageTip1: '• GPS device coordinates are typically WGS84',
        usageTip2: '• Display on Chinese map apps requires conversion to corresponding system',
        usageTip3: '• Offset between systems can reach hundreds of meters, conversion is important',
        offsetRef: '📊 Offset Reference:',
        offsetRef1: '• WGS84 → GCJ02: Usually 50-500m offset',
        offsetRef2: '• GCJ02 → BD09: Usually 50-200m offset',
        offsetRef3: '• WGS84 → BD09: Usually 100-600m offset',

        // Coordinate system options
        wgs84Option: 'WGS84 - GPS (Google Maps/International)',
        gcj02Option: 'GCJ02 - China Standard (Amap/Tencent)',
        bd09Option: 'BD09 - Baidu Maps Only',
        wgs84Short: 'WGS84 - GPS',
        gcj02Short: 'GCJ02 - Amap/Tencent',
        bd09Short: 'BD09 - Baidu'
    },

    // IpTool
    ip: {
        title: 'IP Address Lookup',
        refresh: 'Refresh',
        querying: 'Querying...',
        queryError: 'Query error:',
        noIpInfo: 'Unable to fetch IP information',
        ipv4Address: 'IPv4 Address',
        ipv6Address: 'IPv6 Address',
        secondary: 'Secondary',
        copy: 'Copy',
        loadingDetails: 'Loading details...',
        location: 'Location',
        isp: 'ISP',
        latLng: 'Lat/Lng:',
        timezone: 'Timezone:',
        asn: 'ASN:',
        thirdPartyCheck: 'Third-party IP Analysis',
        thirdPartyHint: 'Click links below to view detailed reports on professional platforms',
        abuseIpDb: '📋 AbuseIPDB (Blacklist Check)',
        scamalytics: '🛡️ Scamalytics (Fraud Detection)',
        networkError: 'Unable to fetch IP info, please check your network connection'
    },

    // Common
    common: {
        copy: 'Copy',
        clear: 'Clear',
        convert: 'Convert',
        calculate: 'Calculate',
        result: 'Result'
    }
}
