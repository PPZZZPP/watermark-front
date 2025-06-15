import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// 这个API会将我们的服务工作者启动在浏览器中，返回一个包含请求处理程序的值
export const worker = setupWorker(...handlers); 