import { userHandlers } from './user-handlers';
import { roleHandlers } from './role-handlers';
import { projectHandlers } from './project-handlers';
import { videoHandlers } from './video-handlers';
import { watermarkHandlers } from './watermark-handlers';

// 整合所有接口处理程序
export const handlers = [
  ...userHandlers,
  ...roleHandlers,
  ...projectHandlers,
  ...videoHandlers,
  ...watermarkHandlers
];

export default handlers; 