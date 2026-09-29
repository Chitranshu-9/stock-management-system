import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { IServiceClient, ServiceConfig } from '../ServiceContract';

// Define the absolute path to the generic struct mapping
const PROTO_PATH = path.join(__dirname, '../../../../shared/hardware_ai.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const hardware_ai = protoDescriptor.hardware_ai as any;

export class AIScannerClient implements IServiceClient {
    private client: any;
    private config: ServiceConfig;

    constructor() {
        // Load configuration securely avoiding hardcoded secrets/URLs in production
        const baseUrl = process.env.AI_SCANNER_URL || '127.0.0.1:50051';
        this.config = {
            name: 'ai-scanner',
            version: 'v1',
            enabled: process.env.AI_SCANNER_ENABLED !== 'false',
            baseUrl: baseUrl,
            capabilities: {
                identify: true,
                scan: true,
                enroll: true
            },
            timeoutMs: parseInt(process.env.AI_SCANNER_TIMEOUT_MS || '40000', 10),
            retryCount: parseInt(process.env.AI_SCANNER_RETRY_COUNT || '0', 10)
        };

        // Securely handle gRPC definitions + Payload truncation logic
        this.client = new hardware_ai.HardwareAI(baseUrl, grpc.credentials.createInsecure(), {
            'grpc.max_receive_message_length': 15 * 1024 * 1024,
            'grpc.max_send_message_length': 15 * 1024 * 1024
        });
    }

    public getConfig(): ServiceConfig {
        return this.config;
    }

    public async healthCheck(): Promise<boolean> {
        return new Promise((resolve) => {
            const deadline = new Date();
            deadline.setSeconds(deadline.getSeconds() + 5);
            this.client.waitForReady(deadline, (err: Error | null) => {
                if (err) {
                    console.warn(`[AIScannerClient] HealthCheck failed: ${err.message}`);
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    public async request<T>(operation: string, payload: any): Promise<T> {
        return new Promise((resolve, reject) => {
            if (operation === 'scan') {
                this.client.RecognizeJobs({
                    image_data: payload.imageData,
                    tenant_id: payload.tenantId,
                    original_name: payload.originalName
                }, (err: any, response: any) => {
                    if (err) return reject(err);
                    if (response.status && response.status.startsWith('error')) {
                        return reject(new Error(response.status));
                    }
                    resolve(response as T);
                });
            } else if (operation === 'enroll') {
                this.client.EnrollEmbedding({
                    image_path: payload.imagePath,
                    sku: payload.sku,
                    name: payload.name,
                    product_id: payload.productId,
                    tenant_id: payload.tenantId
                }, (err: any, response: any) => {
                    if (err) return reject(err);
                    if (response.status === 'error') {
                        return reject(new Error(response.message));
                    }
                    resolve(response as T);
                });
            } else {
                reject(new Error(`Operation [${operation}] is not supported by ai-scanner.`));
            }
        });
    }
}
