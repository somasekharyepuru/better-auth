/**
 * QR Code component for Daymark mobile app
 * Display QR codes using expo-barcode-scanner
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { BarCode } from 'expo-barcode-scanner';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import * as QRCode from 'qrcode';
import { typography, spacing, radius } from '@/constants/Theme';

interface QRCodeProps {
    value: string;
    size?: number;
}

export default function QRCodeComponent({ value, size = 200 }: QRCodeProps) {
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const canvasRef = useRef<any>(null);

    useEffect(() => {
        if (!value) {
            setQrDataUrl(null);
            return;
        }

        // Generate QR code and convert to data URL
        const qrUrl = QRCode.toDataURL(value, {
            width: size,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });
        setQrDataUrl(qrUrl);
    }, [value, size]);

    if (!value) {
        return (
            <View style={[styles.container, { width: size, height: size }]}>
                <View style={styles.placeholder}>
                    <Text style={[styles.placeholderText, { color: Colors.light.textTertiary }]}>
                        No QR data
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <BarCode
                value={qrDataUrl || ''}
                style={styles.qrCode}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: radius.md,
        overflow: 'hidden',
    },
    placeholder: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.light.backgroundSecondary,
    },
    placeholderText: {
        ...typography.caption1,
    },
    qrCode: {
        width: '100%',
        height: '100%',
    },
});
