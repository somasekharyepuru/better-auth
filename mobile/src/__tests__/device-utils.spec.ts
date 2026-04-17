import { getDeviceType, getDeviceInfo } from '../lib/device-utils';

const mockIcons = {
  Smartphone: 'smartphone-icon',
  Monitor: 'monitor-icon',
  Laptop: 'laptop-icon',
  Globe: 'globe-icon',
};

describe('getDeviceType', () => {
  it('detects iPhone as mobile', () => {
    expect(getDeviceType('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)')).toBe('mobile');
  });

  it('detects Android mobile as mobile', () => {
    expect(getDeviceType('Mozilla/5.0 (Linux; Android 13; Mobile)')).toBe('mobile');
  });

  it('detects Mac as desktop', () => {
    expect(getDeviceType('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe('desktop');
  });

  it('detects Windows as desktop', () => {
    expect(getDeviceType('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('desktop');
  });

  it('detects Linux as desktop', () => {
    expect(getDeviceType('Mozilla/5.0 (X11; Linux x86_64)')).toBe('desktop');
  });

  it('detects Android tablet as mobile', () => {
    expect(getDeviceType('Mozilla/5.0 (Linux; Android 13; Tablet)')).toBe('mobile');
  });

  it('detects iPad as mobile', () => {
    expect(getDeviceType('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)')).toBe('mobile');
  });

  it('returns other for unknown UA', () => {
    expect(getDeviceType('some random string')).toBe('other');
  });

  it('handles empty string', () => {
    expect(getDeviceType('')).toBe('other');
  });

  it('is case insensitive', () => {
    expect(getDeviceType('IPHONE BROWSER')).toBe('mobile');
  });
});

describe('getDeviceInfo', () => {
  it('detects iPhone', () => {
    expect(getDeviceInfo('Mozilla/5.0 (iPhone)', mockIcons)).toEqual({
      icon: 'smartphone-icon',
      type: 'Mobile',
    });
  });

  it('detects Android mobile', () => {
    expect(getDeviceInfo('Android Mobile', mockIcons)).toEqual({
      icon: 'smartphone-icon',
      type: 'Mobile',
    });
  });

  it('detects Mac', () => {
    expect(getDeviceInfo('Macintosh', mockIcons)).toEqual({
      icon: 'monitor-icon',
      type: 'macOS',
    });
  });

  it('detects Windows', () => {
    expect(getDeviceInfo('Windows NT', mockIcons)).toEqual({
      icon: 'monitor-icon',
      type: 'Windows',
    });
  });

  it('detects Linux', () => {
    expect(getDeviceInfo('Linux x86_64', mockIcons)).toEqual({
      icon: 'monitor-icon',
      type: 'Linux',
    });
  });

  it('detects Android tablet', () => {
    expect(getDeviceInfo('Android Tablet', mockIcons)).toEqual({
      icon: 'smartphone-icon',
      type: 'Android',
    });
  });

  it('detects iPad', () => {
    expect(getDeviceInfo('iPad', mockIcons)).toEqual({
      icon: 'laptop-icon',
      type: 'Tablet',
    });
  });

  it('detects generic tablet', () => {
    expect(getDeviceInfo('SomeTablet tablet browser', mockIcons)).toEqual({
      icon: 'laptop-icon',
      type: 'Tablet',
    });
  });

  it('returns Browser for unknown', () => {
    expect(getDeviceInfo('unknown', mockIcons)).toEqual({
      icon: 'globe-icon',
      type: 'Browser',
    });
  });

  it('handles empty string', () => {
    expect(getDeviceInfo('', mockIcons)).toEqual({
      icon: 'globe-icon',
      type: 'Browser',
    });
  });
});
