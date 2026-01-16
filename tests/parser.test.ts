import { describe, it, expect } from 'vitest';
import { parseLcov } from '../src/parser';

describe('parseLcov', () => {
    it('should parse a single file record', () => {
        const lcov = `SF:src/index.ts
LF:100
LH:80
FNF:10
FNH:8
BRF:20
BRH:15
end_of_record`;

        const result = parseLcov(lcov);
        
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            file: 'src/index.ts',
            linesFound: 100,
            linesHit: 80,
            functionsFound: 10,
            functionsHit: 8,
            branchesFound: 20,
            branchesHit: 15,
        });
    });

    it('should parse multiple file records', () => {
        const lcov = `SF:src/file1.ts
LF:50
LH:40
FNF:5
FNH:4
BRF:10
BRH:8
end_of_record
SF:src/file2.ts
LF:200
LH:100
FNF:20
FNH:10
BRF:40
BRH:20
end_of_record`;

        const result = parseLcov(lcov);
        
        expect(result).toHaveLength(2);
        expect(result[0].file).toBe('src/file1.ts');
        expect(result[1].file).toBe('src/file2.ts');
    });

    it('should handle empty content', () => {
        const result = parseLcov('');
        expect(result).toHaveLength(0);
    });

    it('should handle content with only whitespace', () => {
        const result = parseLcov('   \n\n   \n');
        expect(result).toHaveLength(0);
    });

    it('should handle file with no coverage data (zeros)', () => {
        const lcov = `SF:src/empty.ts
LF:0
LH:0
FNF:0
FNH:0
BRF:0
BRH:0
end_of_record`;

        const result = parseLcov(lcov);
        
        expect(result).toHaveLength(1);
        expect(result[0].linesFound).toBe(0);
        expect(result[0].linesHit).toBe(0);
    });

    it('should handle records with missing metrics (defaults to 0)', () => {
        const lcov = `SF:src/partial.ts
LF:50
LH:25
end_of_record`;

        const result = parseLcov(lcov);
        
        expect(result).toHaveLength(1);
        expect(result[0].linesFound).toBe(50);
        expect(result[0].linesHit).toBe(25);
        expect(result[0].functionsFound).toBe(0);
        expect(result[0].functionsHit).toBe(0);
        expect(result[0].branchesFound).toBe(0);
        expect(result[0].branchesHit).toBe(0);
    });

    it('should handle absolute file paths', () => {
        const lcov = `SF:/Users/developer/project/src/module.ts
LF:100
LH:100
end_of_record`;

        const result = parseLcov(lcov);
        
        expect(result).toHaveLength(1);
        expect(result[0].file).toBe('/Users/developer/project/src/module.ts');
    });

    it('should handle Windows-style paths', () => {
        const lcov = `SF:C:\\Users\\developer\\project\\src\\module.ts
LF:100
LH:100
end_of_record`;

        const result = parseLcov(lcov);
        
        expect(result).toHaveLength(1);
        expect(result[0].file).toBe('C:\\Users\\developer\\project\\src\\module.ts');
    });

    it('should ignore lines before SF record', () => {
        const lcov = `TN:
LF:9999
SF:src/actual.ts
LF:50
LH:25
end_of_record`;

        const result = parseLcov(lcov);
        
        expect(result).toHaveLength(1);
        expect(result[0].linesFound).toBe(50);
    });

    it('should ignore incomplete records (no end_of_record)', () => {
        const lcov = `SF:src/incomplete.ts
LF:100
LH:50`;

        const result = parseLcov(lcov);
        
        expect(result).toHaveLength(0);
    });

    it('should handle mixed complete and incomplete records', () => {
        const lcov = `SF:src/complete.ts
LF:100
LH:50
end_of_record
SF:src/incomplete.ts
LF:200
LH:100`;

        const result = parseLcov(lcov);
        
        expect(result).toHaveLength(1);
        expect(result[0].file).toBe('src/complete.ts');
    });

    it('should ignore unrecognized lines within a record', () => {
        const lcov = `SF:src/with-extra.ts
TN:test-name
DA:1,5
DA:2,0
FNDA:1,myFunction
FN:1,myFunction
LF:100
LH:80
FNF:10
FNH:8
BRF:20
BRH:15
BRDA:1,0,0,1
end_of_record`;

        const result = parseLcov(lcov);
        
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            file: 'src/with-extra.ts',
            linesFound: 100,
            linesHit: 80,
            functionsFound: 10,
            functionsHit: 8,
            branchesFound: 20,
            branchesHit: 15,
        });
    });

    it('should handle records with extra whitespace', () => {
        const lcov = `  SF:src/whitespace.ts  
  LF:50  
  LH:25  
  FNF:5  
  FNH:4  
  BRF:10  
  BRH:8  
  end_of_record  `;

        const result = parseLcov(lcov);
        
        expect(result).toHaveLength(1);
        expect(result[0].file).toBe('src/whitespace.ts');
    });

    it('should handle malformed numeric values gracefully (default to 0)', () => {
        const lcov = `SF:src/malformed.ts
LF:invalid
LH:abc
FNF:
FNH:NaN
BRF:undefined
BRH:null
end_of_record`;

        const result = parseLcov(lcov);
        
        expect(result).toHaveLength(1);
        expect(result[0].file).toBe('src/malformed.ts');
        // All malformed values should default to 0
        expect(result[0].linesFound).toBe(0);
        expect(result[0].linesHit).toBe(0);
        expect(result[0].functionsFound).toBe(0);
        expect(result[0].functionsHit).toBe(0);
        expect(result[0].branchesFound).toBe(0);
        expect(result[0].branchesHit).toBe(0);
    });
});
