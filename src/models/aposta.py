from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.user import db

class Aposta(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    data = db.Column(db.Date, nullable=False, default=datetime.utcnow().date())
    entrada = db.Column(db.Float, nullable=False)
    odd = db.Column(db.Float, nullable=False)
    valor_final = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def total_previsto(self):
        return self.entrada * self.odd

    def __repr__(self):
        return f'<Aposta {self.id} - {self.data}>'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'data': self.data.isoformat() if self.data else None,
            'entrada': self.entrada,
            'odd': self.odd,
            'total_previsto': self.total_previsto,
            'valor_final': self.valor_final,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

