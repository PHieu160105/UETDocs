const ProcessSteps = ({ steps }) => (
  <section id="process" className="process">
    <div className="section-head">
      <div>
        <span className="section-kicker">Quy trình vận hành</span>
        <h2>Quy trình duyệt minh bạch</h2>
        <p>Trang home mới vẫn bám đúng luồng upload private, kiểm duyệt và công khai của hệ thống hiện tại.</p>
      </div>
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
