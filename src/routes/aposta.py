from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from datetime import datetime
from src.models.user import db
from src.models.aposta import Aposta

aposta_bp = Blueprint('aposta', __name__)

@aposta_bp.route('/apostas', methods=['GET'])
@login_required
def get_apostas():
    apostas = Aposta.query.filter_by(user_id=current_user.id).order_by(Aposta.data.desc()).all()
    return jsonify([aposta.to_dict() for aposta in apostas])

@aposta_bp.route('/apostas', methods=['POST'])
@login_required
def create_aposta():
    data = request.json
    
    # Converter string de data para objeto date
    data_aposta = datetime.strptime(data['data'], '%Y-%m-%d').date()
    
    aposta = Aposta(
        user_id=current_user.id,
        data=data_aposta,
        entrada=float(data['entrada']),
        odd=float(data['odd']),
        valor_final=float(data.get('valor_final', 0))
    )
    
    db.session.add(aposta)
    db.session.commit()
    
    return jsonify(aposta.to_dict()), 201

@aposta_bp.route('/apostas/<int:aposta_id>', methods=['GET'])
@login_required
def get_aposta(aposta_id):
    aposta = Aposta.query.filter_by(id=aposta_id, user_id=current_user.id).first_or_404()
    return jsonify(aposta.to_dict())

@aposta_bp.route('/apostas/<int:aposta_id>', methods=['PUT'])
@login_required
def update_aposta(aposta_id):
    aposta = Aposta.query.filter_by(id=aposta_id, user_id=current_user.id).first_or_404()
    data = request.json
    
    if 'data' in data:
        aposta.data = datetime.strptime(data['data'], '%Y-%m-%d').date()
    if 'entrada' in data:
        aposta.entrada = float(data['entrada'])
    if 'odd' in data:
        aposta.odd = float(data['odd'])
    if 'valor_final' in data:
        aposta.valor_final = float(data['valor_final'])
    
    aposta.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(aposta.to_dict())

@aposta_bp.route('/apostas/<int:aposta_id>', methods=['DELETE'])
@login_required
def delete_aposta(aposta_id):
    aposta = Aposta.query.filter_by(id=aposta_id, user_id=current_user.id).first_or_404()
    db.session.delete(aposta)
    db.session.commit()
    return '', 204

@aposta_bp.route('/apostas/resumo', methods=['GET'])
@login_required
def get_resumo():
    apostas = Aposta.query.filter_by(user_id=current_user.id).all()
    
    total_investido = sum(aposta.entrada for aposta in apostas)
    total_retorno_bruto = sum(aposta.valor_final for aposta in apostas)
    total_retorno_liquido = total_retorno_bruto - total_investido
    total_previsto = sum(aposta.total_previsto for aposta in apostas)
    
    return jsonify({
        'total_investido': total_investido,
        'total_retorno_bruto': total_retorno_bruto,
        'total_retorno_liquido': total_retorno_liquido,
        'total_previsto': total_previsto,
        'quantidade_apostas': len(apostas)
    })

