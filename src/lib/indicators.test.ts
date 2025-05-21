import { SMACalculator, EMACalculator, RsiCalculator, MACDCalculator, BollingerBandsCalculator } from './indicators';

describe('SMACalculator', () => {
  describe('constructor', () => {
    it('should throw error for non-positive period', () => {
      expect(() => new SMACalculator(0)).toThrow('Period must be a positive integer.');
      expect(() => new SMACalculator(-1)).toThrow('Period must be a positive integer.');
    });

    it('should initialize correctly with a positive period', () => {
      const calculator = new SMACalculator(5);
      expect(calculator.getResult()).toBeNull();
    });
  });

  describe('update and getResult', () => {
    it('should return null if not enough data', () => {
      const calculator = new SMACalculator(3);
      calculator.update(10);
      expect(calculator.getResult()).toBeNull();
      calculator.update(20);
      expect(calculator.getResult()).toBeNull();
    });

    it('should calculate SMA correctly as data comes in', () => {
      const calculator = new SMACalculator(3);
      calculator.update(10); // prices: [10]
      expect(calculator.getResult()).toBeNull();
      calculator.update(20); // prices: [10, 20]
      expect(calculator.getResult()).toBeNull();
      calculator.update(30); // prices: [10, 20, 30], SMA = (10+20+30)/3 = 20
      expect(calculator.getResult()).toBe(20);
      calculator.update(40); // prices: [20, 30, 40], SMA = (20+30+40)/3 = 30
      expect(calculator.getResult()).toBe(30);
      calculator.update(50); // prices: [30, 40, 50], SMA = (30+40+50)/3 = 40
      expect(calculator.getResult()).toBe(40);
    });

    it('should handle period of 1', () => {
      const calculator = new SMACalculator(1);
      calculator.update(10);
      expect(calculator.getResult()).toBe(10);
      calculator.update(25);
      expect(calculator.getResult()).toBe(25);
    });
  });

  describe('seed', () => {
    it('should return null if seeded with insufficient data', () => {
      const calculator = new SMACalculator(5);
      calculator.seed([1, 2, 3]);
      expect(calculator.getResult()).toBeNull();
    });

    it('should calculate SMA correctly after seeding with exact period data', () => {
      const calculator = new SMACalculator(3);
      calculator.seed([10, 20, 30]); // SMA = (10+20+30)/3 = 20
      expect(calculator.getResult()).toBe(20);
    });

    it('should calculate SMA correctly after seeding with more than period data', () => {
      const calculator = new SMACalculator(3);
      calculator.seed([10, 20, 30, 40, 50]); // Last 3: [30, 40, 50], SMA = 40
      expect(calculator.getResult()).toBe(40);
    });
    
    it('should correctly calculate SMA with seed and then update', () => {
      const calculator = new SMACalculator(3);
      calculator.seed([10, 20, 30, 40]); // SMA of [20,30,40] = 30
      expect(calculator.getResult()).toBe(30);
      calculator.update(50); // prices: [30, 40, 50], SMA = 40
      expect(calculator.getResult()).toBe(40);
    });

    it('should reset and calculate correctly if seed is called multiple times', () => {
      const calculator = new SMACalculator(3);
      calculator.seed([1,2,3]);
      expect(calculator.getResult()).toBe(2);
      calculator.seed([10,20,30,40,50]);
      expect(calculator.getResult()).toBe(40);
    });

    it('should handle empty seed array', () => {
      const calculator = new SMACalculator(3);
      calculator.seed([]);
      expect(calculator.getResult()).toBeNull();
      calculator.update(10);
      expect(calculator.getResult()).toBeNull();
      calculator.update(20);
      expect(calculator.getResult()).toBeNull();
      calculator.update(30);
      expect(calculator.getResult()).toBe(20);
    });
  });
});

describe('EMACalculator', () => {
  const precision = 6; // Define precision for floating point comparisons

  describe('constructor', () => {
    it('should throw error for non-positive period', () => {
      expect(() => new EMACalculator(0)).toThrow('Period must be a positive integer.');
      expect(() => new EMACalculator(-1)).toThrow('Period must be a positive integer.');
    });
    it('should initialize correctly with a positive period', () => {
      const calculator = new EMACalculator(5);
      expect(calculator.getResult()).toBeNull();
    });
  });

  describe('update and getResult', () => {
    it('should return null if not enough data (before first SMA is formed)', () => {
      const calculator = new EMACalculator(3);
      expect(calculator.update(10)).toBeNull();
      expect(calculator.update(20)).toBeNull();
      expect(calculator.update(30)).toBeNull(); 
    });

    it('should calculate EMA correctly after enough updates (simulating seeding effect)', () => {
      const period = 3;
      const calculator = new EMACalculator(period);
      
      calculator.seed([10, 20, 30]); 
      expect(calculator.getResult()).toBeCloseTo(20, precision);
      
      calculator.update(40);
      expect(calculator.getResult()).toBeCloseTo(30, precision);

      calculator.update(50);
      expect(calculator.getResult()).toBeCloseTo(40, precision);
    });
  });

  describe('seed', () => {
    it('should return null if seeded with data less than period', () => {
      const calculator = new EMACalculator(5);
      calculator.seed([1, 2, 3]);
      expect(calculator.getResult()).toBeNull();
    });

    it('should calculate EMA correctly after seeding with exact period data (SMA)', () => {
      const calculator = new EMACalculator(3);
      calculator.seed([10, 20, 30]); 
      expect(calculator.getResult()).toBeCloseTo(20, precision);
    });

    it('should calculate EMA correctly after seeding with more than period data', () => {
      const calculator = new EMACalculator(3);
      calculator.seed([10, 20, 30, 40, 50]);
      expect(calculator.getResult()).toBeCloseTo(40, precision);
    });

    it('should correctly calculate EMA with seed and then update', () => {
      const calculator = new EMACalculator(3);
      calculator.seed([10, 20, 30, 40]);
      expect(calculator.getResult()).toBeCloseTo(30, precision);
      
      calculator.update(50);
      expect(calculator.getResult()).toBeCloseTo(40, precision);
    });
    
    it('should reset and calculate correctly if seed is called multiple times', () => {
      const calculator = new EMACalculator(3);
      calculator.seed([1,2,3]); 
      expect(calculator.getResult()).toBeCloseTo(2, precision);
      calculator.seed([10,20,30,40,50]); 
      expect(calculator.getResult()).toBeCloseTo(40, precision);
    });

    it('should handle empty seed array', () => {
      const calculator = new EMACalculator(3);
      calculator.seed([]);
      expect(calculator.getResult()).toBeNull();
      calculator.update(10); 
      expect(calculator.getResult()).toBeNull();
    });
  });
});

describe('RsiCalculator', () => {
  const precision = 6;

  describe('constructor', () => {
    it('should throw error for non-positive period', () => {
      expect(() => new RsiCalculator(0)).toThrow('Period must be a positive integer.');
      expect(() => new RsiCalculator(-1)).toThrow('Period must be a positive integer.');
    });
    it('should initialize correctly with a positive period', () => {
      const calculator = new RsiCalculator(14);
      expect(calculator.getResult()).toBeNull();
    });
  });

  describe('seed', () => {
    it('should return null if seeded with data less than period + 1', () => {
      const calculator = new RsiCalculator(14);
      calculator.seed(Array(14).fill(10)); // Needs 15 data points for 14 period RSI
      expect(calculator.getResult()).toBeNull();
    });

    it('should calculate RSI correctly after seeding with enough data (Wilder\'s RSI)', () => {
      const calculator = new RsiCalculator(3); // Using a small period for easier manual calc
      calculator.seed([10, 13, 11, 14]); 
      expect(calculator.getResult()).toBeCloseTo(75, precision);
    });

    it('should calculate RSI as 100 if all losses are zero', () => {
      const calculator = new RsiCalculator(3);
      calculator.seed([10, 11, 12, 13]); 
      expect(calculator.getResult()).toBe(100);
    });

    it('should calculate RSI as 0 if all gains are zero', () => {
      const calculator = new RsiCalculator(3);
      calculator.seed([13, 12, 11, 10]); 
      expect(calculator.getResult()).toBe(0);
    });
    
    it('should handle seeding with longer series for RSI', () => {
        const calc = new RsiCalculator(3);
        calc.seed([10, 13, 11, 14, 12]);
        expect(calc.getResult()).toBeCloseTo(54.545454, precision);

        // This checks the state after seed correctly prepares for next update
        calc.update(15); 
        expect(calc.getResult()).toBeCloseTo(71.830985, precision);
    });


    it('should reset and calculate correctly if seed is called multiple times', () => {
      const calculator = new RsiCalculator(3);
      calculator.seed([10, 13, 11, 14]); 
      expect(calculator.getResult()).toBeCloseTo(75, precision);
      calculator.seed([13, 12, 11, 10]); 
      expect(calculator.getResult()).toBe(0);
    });
  });

  describe('update and getResult', () => {
    it('should calculate RSI correctly with update after seed', () => {
      const calculator = new RsiCalculator(3);
      calculator.seed([10, 13, 11, 14]);
      expect(calculator.getResult()).toBeCloseTo(75, precision);

      calculator.update(12);
      expect(calculator.getResult()).toBeCloseTo(54.545454, precision);

      calculator.update(15);
      expect(calculator.getResult()).toBeCloseTo(71.830985, precision);
    });

    it('should return null if update is called without enough initial data (no seed)', () => {
        const calculator = new RsiCalculator(3);
        expect(calculator.update(10)).toBeNull(); 
        expect(calculator.update(11)).toBeNull(); 
        expect(calculator.update(10)).toBeNull(); 
        expect(calculator.update(11)).not.toBeNull(); 
    });
  });
});

describe('MACDCalculator', () => {
  const precision = 6; 
  const shortPeriod = 3;
  const longPeriod = 6;
  const signalPeriod = 4;
  
  describe('constructor', () => {
    it('should throw error for non-positive periods', () => {
      expect(() => new MACDCalculator(0, 5, 5)).toThrow('Periods must be positive integers.');
      expect(() => new MACDCalculator(5, 0, 5)).toThrow('Periods must be positive integers.');
      expect(() => new MACDCalculator(5, 5, 0)).toThrow('Periods must be positive integers.');
    });
    it('should throw error if shortPeriod >= longPeriod', () => {
      expect(() => new MACDCalculator(5, 5, 3)).toThrow('Short period must be less than long period for MACD.');
      expect(() => new MACDCalculator(6, 5, 3)).toThrow('Short period must be less than long period for MACD.');
    });
    it('should initialize correctly', () => {
      const calculator = new MACDCalculator(shortPeriod, longPeriod, signalPeriod);
      expect(calculator.getResult()).toBeNull();
    });
  });

  describe('seed', () => {
    const prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]; // 11 prices

    it('should return null if seeded with insufficient data for long EMA', () => {
      const calculator = new MACDCalculator(shortPeriod, longPeriod, signalPeriod);
      calculator.seed(prices.slice(0, longPeriod -1)); 
      expect(calculator.getResult()).toBeNull();
    });
    
    it('should return null or partial result if seeded with insufficient data for signal line after MACD formed', () => {
        const calculator = new MACDCalculator(shortPeriod, longPeriod, signalPeriod);
        // Need longPeriod prices for first MACD. Then signalPeriod MACD values for first signal.
        // So, longPeriod + signalPeriod - 1 prices are needed for the first full MACD result.
        const requiredPricesForFullResult = longPeriod + signalPeriod - 1;
        calculator.seed(prices.slice(0, requiredPricesForFullResult - 1)); 
        const result = calculator.getResult();
        if (result) { // If MACD line itself could form
             expect(result.signal).toBeNull();
             expect(result.histogram).toBeNull();
        } else {
            expect(result).toBeNull();
        }
    });

    it('should calculate MACD correctly after seeding with enough data', () => {
      const calculator = new MACDCalculator(shortPeriod, longPeriod, signalPeriod);
      calculator.seed(prices);

      const finalShortEma = 19;
      const finalLongEma = 17.5;
      const expectedMacdLine = finalShortEma - finalLongEma; 
      const expectedSignalLine = 1.5; 
      const expectedHistogram = expectedMacdLine - expectedSignalLine;

      const result = calculator.getResult();
      expect(result).not.toBeNull();
      expect(result!.macd).toBeCloseTo(expectedMacdLine, precision);
      expect(result!.signal).toBeCloseTo(expectedSignalLine, precision);
      expect(result!.histogram).toBeCloseTo(expectedHistogram, precision);
    });
  });

  describe('update', () => {
    const prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]; 
    const calculator = new MACDCalculator(shortPeriod, longPeriod, signalPeriod);
    calculator.seed(prices);

    it('should calculate MACD correctly on update', () => {
      const result = calculator.update(21);
      expect(result).not.toBeNull();
      expect(result!.macd).toBeCloseTo(1.5, precision);
      expect(result!.signal).toBeCloseTo(1.5, precision);
      expect(result!.histogram).toBeCloseTo(0, precision);
    });
  });
});

describe('BollingerBandsCalculator', () => {
  const precision = 6;
  const period = 3;
  const numStdDev = 2;

  describe('constructor', () => {
    it('should throw error for non-positive period', () => {
      expect(() => new BollingerBandsCalculator(0, numStdDev)).toThrow('Period must be a positive integer.');
    });
    it('should throw error for non-positive numStdDev', () => {
      expect(() => new BollingerBandsCalculator(period, 0)).toThrow('Number of standard deviations must be positive.');
    });
    it('should initialize correctly', () => {
      const calculator = new BollingerBandsCalculator(period, numStdDev);
      expect(calculator.getResult()).toBeNull();
    });
  });

  describe('seed', () => {
    it('should return null if seeded with insufficient data', () => {
      const calculator = new BollingerBandsCalculator(period, numStdDev);
      calculator.seed([10, 11]); // Needs 3 for period 3
      expect(calculator.getResult()).toBeNull();
    });

    it('should calculate Bollinger Bands correctly after seeding with exact period data', () => {
      const calculator = new BollingerBandsCalculator(period, numStdDev);
      const seedPrices = [10, 12, 11]; // Avg = 11. DiffSq: (10-11)^2=1, (12-11)^2=1, (11-11)^2=0. SumSqDiff=2. Var=2/3. StdDev=sqrt(2/3)=0.816496
      // Middle = 11
      // Upper = 11 + 2 * 0.816496 = 11 + 1.632992 = 12.632992
      // Lower = 11 - 2 * 0.816496 = 11 - 1.632992 = 9.367008
      calculator.seed(seedPrices);
      const result = calculator.getResult();
      expect(result).not.toBeNull();
      expect(result!.middle).toBeCloseTo(11, precision);
      expect(result!.upper).toBeCloseTo(12.632992, precision);
      expect(result!.lower).toBeCloseTo(9.367008, precision);
    });

    it('should calculate Bollinger Bands correctly after seeding with more than period data', () => {
      const calculator = new BollingerBandsCalculator(period, numStdDev);
      const seedPrices = [10, 12, 11, 13, 12]; // Last 3: [11, 13, 12]
      // Avg = (11+13+12)/3 = 12. DiffSq: (11-12)^2=1, (13-12)^2=1, (12-12)^2=0. SumSqDiff=2. Var=2/3. StdDev=0.816496
      // Middle = 12
      // Upper = 12 + 2 * 0.816496 = 13.632992
      // Lower = 12 - 2 * 0.816496 = 10.367008
      calculator.seed(seedPrices);
      const result = calculator.getResult();
      expect(result).not.toBeNull();
      expect(result!.middle).toBeCloseTo(12, precision);
      expect(result!.upper).toBeCloseTo(13.632992, precision);
      expect(result!.lower).toBeCloseTo(10.367008, precision);
    });
  });

  describe('update', () => {
    const calculator = new BollingerBandsCalculator(period, numStdDev);
    const seedPrices = [10, 12, 11, 13]; // Last 3 for seed: [12,11,13]. Middle = (12+11+13)/3 = 12. StdDev = sqrt(((0)^2 + (-1)^2 + (1)^2)/3) = sqrt(2/3) = 0.816496
    calculator.seed(seedPrices);
    // After seed: Middle=12, Upper=13.632992, Lower=10.367008

    it('should calculate Bollinger Bands correctly on update', () => {
      // Update with 12. New window: [11, 13, 12]
      // Middle = (11+13+12)/3 = 12
      // Prices for stddev: [11,13,12]. DiffSq: (11-12)^2=1, (13-12)^2=1, (12-12)^2=0. SumSqDiff=2. Var=2/3. StdDev=0.816496
      // Upper = 12 + 2 * 0.816496 = 13.632992
      // Lower = 12 - 2 * 0.816496 = 10.367008
      const result = calculator.update(12);
      expect(result).not.toBeNull();
      expect(result!.middle).toBeCloseTo(12, precision);
      expect(result!.upper).toBeCloseTo(13.632992, precision);
      expect(result!.lower).toBeCloseTo(10.367008, precision);
    });

     it('should calculate Bollinger Bands correctly on subsequent update', () => {
      // Previous state from above test: window [11,13,12], Middle=12, StdDev=0.816496
      // Update with 14. New window: [13, 12, 14]
      // Middle = (13+12+14)/3 = 13
      // Prices for stddev: [13,12,14]. DiffSq: (13-13)^2=0, (12-13)^2=1, (14-13)^2=1. SumSqDiff=2. Var=2/3. StdDev=0.816496
      // Upper = 13 + 2 * 0.816496 = 14.632992
      // Lower = 13 - 2 * 0.816496 = 11.367008
      const result = calculator.update(14);
      expect(result).not.toBeNull();
      expect(result!.middle).toBeCloseTo(13, precision);
      expect(result!.upper).toBeCloseTo(14.632992, precision);
      expect(result!.lower).toBeCloseTo(11.367008, precision);
    });
  });
});
