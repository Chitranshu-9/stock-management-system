import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

// Define the absolute path to the generic struct mapping
const PROTO_PATH = path.join(__dirname, '../../../shared/hardware_ai.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const hardware_ai = protoDescriptor.hardware_ai as any;

const GRPC_SERVER_URL = '127.0.0.1:50051';

// [Inversion Implementation] Setting MAX Message Length limits to 15MB 
// to securely transport ultra high-definition PNGs avoiding arbitrary truncation traps
const client = new hardware_ai.HardwareAI(GRPC_SERVER_URL, grpc.credentials.createInsecure(), {
    'grpc.max_receive_message_length': 15 * 1024 * 1024,
    'grpc.max_send_message_length': 15 * 1024 * 1024
});

export const grpcRecognizeJobs = async (imageData: Buffer, tenantId: string, originalName: string = 'upload.jpg'): Promise<any> => {
    return new Promise((resolve, reject) => {
        client.RecognizeJobs({ image_data: imageData, tenant_id: tenantId, original_name: originalName },
            (err: any, response: any) => {
                if (err) return reject(err);
                if (response.status && response.status.startsWith('error')) {
                    return reject(new Error(response.status));
                }
                resolve(response);
            });
    });
};

export const grpcEnrollEmbedding = async (imagePath: string, sku: string, name: string, productId: string, tenantId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        client.EnrollEmbedding({
            image_path: imagePath,
            sku,
            name,
            product_id: productId,
            tenant_id: tenantId
        }, (err: any, response: any) => {
            if (err) return reject(err);
            if (response.status === 'error') {
                return reject(new Error(response.message));
            }
            resolve(response);
        });
    });
};
