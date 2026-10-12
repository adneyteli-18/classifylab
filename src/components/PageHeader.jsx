function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        <p className="page-description">{description}</p>
      </div>
      {children && <div className="page-header-actions">{children}</div>}
    </div>
  )
}

export default PageHeader
