const ProcessSteps = ({ steps }) => (
  <section id="process" className="process">
    <div className="section-head">
      <h2>Quy trình duyệt minh bạch</h2>
      <p>Đảm bảo tài liệu sạch, đúng nội dung học thuật trước khi công khai.</p>
    </div>
    <div className="steps">
      {steps.map((step, index) => (
        <div key={step.label} className="step">
          <div className="step-number">0{index + 1}</div>
          <div>
            <h4>{step.label}</h4>
            <p>{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
)

export default ProcessSteps
