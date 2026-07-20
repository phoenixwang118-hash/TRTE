import React from 'react';
import BaseNode from './BaseNode';

// 高清放大节点
export default function UpscaleNode(props) {
  return (
    <BaseNode {...props}>
      <div className="wf-node-hint">连接到上游图像，点击运行放大</div>
    </BaseNode>
  );
}
