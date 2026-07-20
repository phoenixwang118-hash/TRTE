import React from 'react';
import BaseNode from './BaseNode';

// 文件转 base64 dataURL 辅助函数
function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

// 参考图上传节点
export default function ReferenceNode(props) {
  const { data, _callbacks } = props;
  const config = data.config || {};

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    _callbacks?.onUpdateConfig({ imageUrl: dataUrl });
  };

  return (
    <BaseNode {...props}>
      <div className="wf-node-field">
        <label className="wf-node-label">参考图</label>
        <input
          type="file"
          accept="image/*"
          className="wf-node-file"
          onChange={handleFileChange}
        />
      </div>
      {config.imageUrl && (
        <div className="wf-node-thumb">
          <img src={config.imageUrl} alt="reference" />
        </div>
      )}
    </BaseNode>
  );
}
