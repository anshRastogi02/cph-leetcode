function formatArrayToString(str){
    if (!str) return '';

    str = String(str).trim();
    
    try{
        if (/^-?\d+$/.test(str)){
            return str;
        }

        if (!str.startsWith('[') || !str.endsWith(']')){
            return str.replace(/['"]/g, '').trim();
        }
        const parsed = JSON.parse(str.replace(/'/g, '"'));
        if (!Array.isArray(parsed)) {
            return String(parsed).replace(/['"]/g, '').trim();
        }
        return parsed.map(item => 
            item === null ? 'null' : String(item).replace(/['"]/g, '')
        ).join(' ');
        
    } catch (e) {
        return str.replace(/['"[\]]/g, '').replace(/,/g, ' ').trim();
    }}

function splitTestCases(testcases, linesPerCase){
    if (!testcases) return [];
    
    const lines = testcases.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    const result = [];
    
    for (let i = 0; i < lines.length; i += linesPerCase) {
        const testCase = lines.slice(i, i + linesPerCase);
        if (testCase.length === linesPerCase) {
            result.push(testCase.join('\n'));
        }
    }  
    return result;
}

module.exports = {
    formatArrayToString,
    splitTestCases};