import os
import base64
import binascii
import hashlib
import hmac
import html
import json
import re
import secrets
import smtplib
import unicodedata
import uuid
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from urllib.parse import quote, urlencode

import click
import requests
from authlib.integrations.flask_client import OAuth
from dotenv import load_dotenv
from flask import Flask, jsonify, redirect, request, send_from_directory, session
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect, text
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

load_dotenv()

database_url = os.environ.get("DATABASE_URL", "sqlite:///agrocordoba.db")
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app = Flask(__name__)
app.config.update(
    SECRET_KEY=os.environ.get("FLASK_SECRET_KEY", ""),
    SQLALCHEMY_DATABASE_URI=database_url,
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get("COOKIE_SECURE", "false").lower() == "true",
)

if not app.config["SECRET_KEY"]:
    raise RuntimeError("Falta FLASK_SECRET_KEY en backend/.env")

db = SQLAlchemy(app)
oauth = OAuth(app)

google = oauth.register(
    name="google",
    client_id=os.environ.get("GOOGLE_CLIENT_ID"),
    client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


class User(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    google_sub = db.Column(db.String(255), unique=True, nullable=False, index=True)
    email = db.Column(db.String(320), unique=True, nullable=False, index=True)
    name = db.Column(db.String(160), nullable=False)
    avatar = db.Column(db.Text, nullable=False, default="")
    role = db.Column(db.String(20), nullable=False, default="cliente")
    city = db.Column(db.String(100), nullable=False, default="Montería")
    business_type = db.Column(db.String(40), nullable=False, default="Hogar")
    registered_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    password_hash = db.Column(db.String(255), nullable=True)
    gender = db.Column(db.String(20), nullable=False, default="neutro")
    phone = db.Column(db.String(30), nullable=False, default="")
    farm_name = db.Column(db.String(160), nullable=False, default="")
    association = db.Column(db.String(200), nullable=False, default="")
    status = db.Column(db.String(20), nullable=False, default="activo")

    def to_public_dict(self):
        settings = AccountSettings.query.filter_by(user_id=self.id).first()
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "avatar": self.avatar,
            "businessType": self.business_type,
            "city": self.city,
            "role": self.role,
            "authProvider": "google" if not self.google_sub.startswith("local:") else "local",
            "registeredAt": self.registered_at.isoformat(),
            "status": self.status,
            "gender": self.gender,
            "farmName": self.farm_name,
            "association": self.association,
            "products": [
                item.name
                for item in ProducerProduct.query.filter_by(user_id=self.id).order_by(ProducerProduct.id).all()
            ],
        }


class ProducerProduct(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey("user.id"), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    __table_args__ = (db.UniqueConstraint("user_id", "name", name="uq_producer_product_name"),)


class AccountSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey("user.id"), unique=True, nullable=False)
    notifications_enabled = db.Column(db.Boolean, nullable=False, default=True)
    quote_notifications = db.Column(db.Boolean, nullable=False, default=True)
    response_notifications = db.Column(db.Boolean, nullable=False, default=True)


class SettingsVerification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey("user.id"), unique=True, nullable=False)
    code_hash = db.Column(db.String(64), nullable=False)
    pending_email = db.Column(db.String(320), nullable=True)
    pending_name = db.Column(db.String(160), nullable=True)
    pending_phone = db.Column(db.String(30), nullable=True)
    pending_notifications_enabled = db.Column(db.Boolean, nullable=True)
    pending_quote_notifications = db.Column(db.Boolean, nullable=True)
    pending_response_notifications = db.Column(db.Boolean, nullable=True)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    sent_at = db.Column(db.DateTime(timezone=True), nullable=False)
    attempts = db.Column(db.Integer, nullable=False, default=0)


class PasswordResetVerification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey("user.id"), unique=True, nullable=False)
    code_hash = db.Column(db.String(64), nullable=False)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    sent_at = db.Column(db.DateTime(timezone=True), nullable=False)
    attempts = db.Column(db.Integer, nullable=False, default=0)


class ProductListing(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    producer_id = db.Column(db.String(36), db.ForeignKey("user.id"), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    variety = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(60), nullable=False)
    price_cop_kg = db.Column(db.Float, nullable=False)
    price_usd_kg = db.Column(db.Float, nullable=False)
    stock_available_kg = db.Column(db.Float, nullable=False)
    stock_min_kg = db.Column(db.Float, nullable=False)
    min_order_kg = db.Column(db.Float, nullable=False)
    lat = db.Column(db.Float, nullable=False)
    lng = db.Column(db.Float, nullable=False)
    municipality_id = db.Column(db.String(80), nullable=False)
    municipality_name = db.Column(db.String(100), nullable=False)
    image = db.Column(db.Text, nullable=False, default="")
    harvest_season = db.Column(db.String(120), nullable=False)
    packaging = db.Column(db.String(120), nullable=False)
    description = db.Column(db.String(2000), nullable=False, default="")
    featured = db.Column(db.Boolean, nullable=False, default=False)
    producer_experience_years = db.Column(db.Float, nullable=False, default=0)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    certifications = db.relationship(
        "ProductCertification",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="ProductCertification.id",
    )

    def to_public_dict(self):
        producer = db.session.get(User, self.producer_id)
        return {
            **_product_public_fields(self),
            "id": self.id,
            "producerId": self.producer_id,
            "producerName": producer.name if producer else "Productor AgroCórdoba",
            "producerAssociation": producer.association or "Independiente" if producer else "Independiente",
            "producerPhoto": producer.avatar if producer else "",
            "producerWhatsapp": "".join(char for char in (producer.phone or "") if char.isdigit()) if producer else "",
        }


class ProductCertification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.String(36), db.ForeignKey("product_listing.id"), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    __table_args__ = (
        db.UniqueConstraint("product_id", "name", name="uq_product_certification_name"),
    )


class QuotationRecord(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id = db.Column(db.String(36), db.ForeignKey("user.id"), nullable=False, index=True)
    producer_id = db.Column(db.String(36), db.ForeignKey("user.id"), nullable=False, index=True)
    product_id = db.Column(db.String(36), nullable=False, index=True)
    product_listing_id = db.Column(
        db.String(36),
        db.ForeignKey("product_listing.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    product_name = db.Column(db.String(120), nullable=False, default="")
    product_variety = db.Column(db.String(120), nullable=False, default="")
    producer_name = db.Column(db.String(160), nullable=False, default="")
    producer_association = db.Column(db.String(200), nullable=False, default="")
    producer_whatsapp = db.Column(db.String(30), nullable=False, default="")
    client_name = db.Column(db.String(160), nullable=False, default="")
    client_email = db.Column(db.String(320), nullable=False, default="")
    client_phone = db.Column(db.String(30), nullable=False, default="")
    client_business_type = db.Column(db.String(40), nullable=False, default="")
    client_city = db.Column(db.String(100), nullable=False, default="")
    quantity_kg = db.Column(db.Float, nullable=False, default=0)
    destination_zone = db.Column(db.String(40), nullable=False, default="")
    freight_cop = db.Column(db.Float, nullable=False, default=0)
    subtotal_cop = db.Column(db.Float, nullable=False, default=0)
    total_cop = db.Column(db.Float, nullable=False, default=0)
    exchange_rate_cop = db.Column(db.Float, nullable=False, default=4150)
    discount_percent = db.Column(db.Float, nullable=False, default=0)
    notes = db.Column(db.String(1000), nullable=False, default="")
    status = db.Column(db.String(30), nullable=False, default="Pendiente")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    def to_public_dict(self):
        return {
            "productId": self.product_id,
            "productName": self.product_name,
            "productVariety": self.product_variety,
            "producerName": self.producer_name,
            "producerAssociation": self.producer_association,
            "producerWhatsapp": self.producer_whatsapp,
            "clientName": self.client_name,
            "clientEmail": self.client_email,
            "clientPhone": self.client_phone,
            "clientBusinessType": self.client_business_type,
            "clientCity": self.client_city,
            "quantityKg": self.quantity_kg,
            "destinationZone": self.destination_zone,
            "freightCop": self.freight_cop,
            "subtotalCop": self.subtotal_cop,
            "totalCop": self.total_cop,
            "totalUsd": self.total_cop / self.exchange_rate_cop if self.exchange_rate_cop else 0,
            "discountPercent": self.discount_percent,
            "notes": self.notes,
            "id": self.id,
            "clientId": self.client_id,
            "producerId": self.producer_id,
            "status": self.status,
            "createdAt": self.created_at.isoformat(),
        }


def _product_public_fields(listing):
    return {
        "name": listing.name,
        "variety": listing.variety,
        "category": listing.category,
        "priceCopKg": listing.price_cop_kg,
        "priceUsdKg": listing.price_usd_kg,
        "stockAvailableKg": listing.stock_available_kg,
        "stockMinKg": listing.stock_min_kg,
        "minOrderKg": listing.min_order_kg,
        "lat": listing.lat,
        "lng": listing.lng,
        "municipalityId": listing.municipality_id,
        "municipalityName": listing.municipality_name,
        "image": listing.image,
        "harvestSeason": listing.harvest_season,
        "certifications": [item.name for item in listing.certifications],
        "packaging": listing.packaging,
        "description": listing.description,
        "featured": listing.featured,
        "producerExperienceYears": listing.producer_experience_years,
    }


def _apply_product_fields(listing, data):
    field_map = {
        "name": "name",
        "variety": "variety",
        "category": "category",
        "priceCopKg": "price_cop_kg",
        "priceUsdKg": "price_usd_kg",
        "stockAvailableKg": "stock_available_kg",
        "stockMinKg": "stock_min_kg",
        "minOrderKg": "min_order_kg",
        "lat": "lat",
        "lng": "lng",
        "municipalityId": "municipality_id",
        "municipalityName": "municipality_name",
        "image": "image",
        "harvestSeason": "harvest_season",
        "packaging": "packaging",
        "description": "description",
        "featured": "featured",
        "producerExperienceYears": "producer_experience_years",
    }
    numeric_fields = {
        "priceCopKg",
        "priceUsdKg",
        "stockAvailableKg",
        "stockMinKg",
        "minOrderKg",
        "lat",
        "lng",
        "producerExperienceYears",
    }
    for source, destination in field_map.items():
        default = 0 if source in numeric_fields else False if source == "featured" else ""
        setattr(listing, destination, data.get(source, default))
    listing.certifications[:] = [
        ProductCertification(name=name)
        for name in dict.fromkeys(data.get("certifications", []))
    ]


class Favorite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey("user.id"), nullable=False, index=True)
    product_id = db.Column(db.String(120), nullable=False)
    __table_args__ = (db.UniqueConstraint("user_id", "product_id", name="uq_user_favorite_product"),)


class ReadNotification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey("user.id"), nullable=False, index=True)
    quotation_id = db.Column(db.String(36), db.ForeignKey("quotation_record.id"), nullable=False)
    __table_args__ = (db.UniqueConstraint("user_id", "quotation_id", name="uq_user_read_notification"),)


PRODUCT_CATEGORIES = {
    "Cereales", "Tubérculos y Raíces", "Frutas Tropicales",
    "Cacao y Café", "Agroindustria y Derivados", "Otros cultivos",
}


def _product_payload(payload):
    if not isinstance(payload, dict):
        return None, "Los datos del producto no son válidos."
    name = str(payload.get("name", "")).strip()
    category = str(payload.get("category", ""))
    if not name or len(name) > 120 or category not in PRODUCT_CATEGORIES:
        return None, "Escribe un nombre y una categoría válidos."
    if any(len(str(payload.get(field, ""))) > limit for field, limit in (("variety", 120), ("municipalityId", 80), ("municipalityName", 100), ("image", 2_500_000), ("harvestSeason", 120), ("packaging", 120), ("description", 2000))):
        return None, "Uno de los campos supera el tamaño permitido."
    values = {}
    for field in ("priceCopKg", "priceUsdKg", "stockAvailableKg", "stockMinKg", "minOrderKg", "lat", "lng", "producerExperienceYears"):
        try:
            number = float(payload.get(field, 0) or 0)
        except (TypeError, ValueError):
            return None, "Los valores de precio, inventario o ubicación no son válidos."
        if number > 1_000_000_000 or (field not in {"lat", "lng"} and number < 0):
            return None, "Los valores de precio o inventario están fuera del rango permitido."
        if field == "lat" and not -90 <= number <= 90:
            return None, "La latitud debe estar entre -90 y 90."
        if field == "lng" and not -180 <= number <= 180:
            return None, "La longitud debe estar entre -180 y 180."
        values[field] = number
    if values["priceCopKg"] <= 0 or values["stockMinKg"] <= 0 or values["minOrderKg"] <= 0:
        return None, "El precio, el mínimo de inventario y el pedido mínimo deben ser mayores que cero."
    certifications = payload.get("certifications", [])
    if not isinstance(certifications, list) or len(certifications) > 20 or any(not isinstance(item, str) or len(item) > 100 for item in certifications):
        return None, "La lista de certificaciones no es válida."
    values.update({
        "name": name,
        "variety": str(payload.get("variety", "")).strip() or name,
        "category": category,
        "municipalityId": str(payload.get("municipalityId", "")),
        "municipalityName": str(payload.get("municipalityName", "")),
        "image": str(payload.get("image", "")),
        "harvestSeason": str(payload.get("harvestSeason", "Consultar con el productor")),
        "certifications": [item.strip() for item in certifications],
        "packaging": str(payload.get("packaging", "Consultar con el productor")),
        "description": str(payload.get("description", "")),
        "featured": bool(payload.get("featured", False)),
    })
    return values, None


@app.get("/api/products")
def list_products():
    listings = ProductListing.query.join(User, ProductListing.producer_id == User.id).filter(User.status == "activo").order_by(ProductListing.created_at.desc()).all()
    return jsonify({"products": [listing.to_public_dict() for listing in listings]})


@app.post("/api/products")
def create_product():
    user = _current_user()
    if user is None:
        return jsonify({"error": "Inicia sesión para publicar un producto."}), 401
    if user.role != "productor":
        return jsonify({"error": "Solo las cuentas de productor pueden publicar productos."}), 403
    if user.status != "activo":
        return jsonify({"error": "Tu cuenta de productor está pendiente de aprobación."}), 403
    data, error = _product_payload(request.get_json(silent=True))
    if error:
        return jsonify({"error": error}), 400
    listing = ProductListing(producer_id=user.id)
    _apply_product_fields(listing, data)
    db.session.add(listing)
    db.session.commit()
    return jsonify({"product": listing.to_public_dict()}), 201


@app.post("/api/admin/products")
def admin_create_product():
    admin = _current_user()
    if admin is None or admin.role != "admin":
        return jsonify({"error": "Se requiere una sesión de administrador."}), 403
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Los datos del producto no son válidos."}), 400
    producer = db.session.get(User, str(payload.get("producerId", "")))
    if producer is None or producer.role != "productor" or producer.status != "activo":
        return jsonify({"error": "Selecciona un productor activo."}), 400
    data, error = _product_payload(payload)
    if error:
        return jsonify({"error": error}), 400
    listing = ProductListing(producer_id=producer.id)
    _apply_product_fields(listing, data)
    db.session.add(listing)
    db.session.commit()
    return jsonify({"product": listing.to_public_dict()}), 201


@app.put("/api/products/<string:product_id>")
def update_product(product_id):
    user = _current_user()
    if user is None:
        return jsonify({"error": "Inicia sesión para editar un producto."}), 401
    listing = db.session.get(ProductListing, product_id)
    if listing is None:
        return jsonify({"error": "No se encontró el producto."}), 404
    if user.role not in {"productor", "admin"}:
        return jsonify({"error": "No tienes permiso para editar productos."}), 403
    if user.role == "productor" and listing.producer_id != user.id:
        return jsonify({"error": "No tienes permiso para editar este producto."}), 403
    if user.role == "productor" and user.status != "activo":
        return jsonify({"error": "Tu cuenta no está aprobada para administrar publicaciones."}), 403
    data, error = _product_payload(request.get_json(silent=True))
    if error:
        return jsonify({"error": error}), 400
    _apply_product_fields(listing, data)
    db.session.commit()
    return jsonify({"product": listing.to_public_dict()})


@app.delete("/api/products/<string:product_id>")
def delete_product(product_id):
    user = _current_user()
    if user is None:
        return jsonify({"error": "Inicia sesión para eliminar un producto."}), 401
    listing = db.session.get(ProductListing, product_id)
    if listing is None:
        return jsonify({"error": "No se encontró el producto."}), 404
    if user.role not in {"productor", "admin"}:
        return jsonify({"error": "No tienes permiso para eliminar productos."}), 403
    if user.role == "productor" and listing.producer_id != user.id:
        return jsonify({"error": "No tienes permiso para eliminar este producto."}), 403
    if user.role == "productor" and user.status != "activo":
        return jsonify({"error": "Tu cuenta no está aprobada para administrar publicaciones."}), 403
    QuotationRecord.query.filter_by(product_listing_id=listing.id).update(
        {QuotationRecord.product_listing_id: None},
        synchronize_session=False,
    )
    db.session.delete(listing)
    db.session.commit()
    return jsonify({"ok": True})


@app.get("/api/quotations")
def list_quotations():
    user = _current_user()
    if user is None:
        return jsonify({"error": "Inicia sesión para consultar tus cotizaciones."}), 401
    query = QuotationRecord.query
    if user.role == "cliente":
        query = query.filter_by(client_id=user.id)
    elif user.role == "productor":
        if user.status != "activo":
            return jsonify({"error": "Tu cuenta de productor está pendiente de aprobación."}), 403
        query = query.filter_by(producer_id=user.id)
    elif user.role != "admin":
        return jsonify({"error": "Esta cuenta no puede consultar cotizaciones."}), 403
    rows = query.order_by(QuotationRecord.created_at.desc()).all()
    return jsonify({"quotations": [quotation.to_public_dict() for quotation in rows]})


@app.post("/api/quotations")
def create_quotation():
    user = _current_user()
    if user is None:
        return jsonify({"error": "Inicia sesión para solicitar una cotización."}), 401
    if user.role != "cliente":
        return jsonify({"error": "Solo una cuenta de comprador puede solicitar cotizaciones."}), 403
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Los datos de la cotización no son válidos."}), 400
    product_id = str(payload.get("productId", ""))
    listing = db.session.get(ProductListing, product_id)
    if listing is None:
        return jsonify({"error": "Este producto no está publicado en el backend."}), 404
    try:
        quantity = float(payload.get("quantityKg", 0))
        freight = float(payload.get("freightCop", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "La cantidad o el transporte no son válidos."}), 400
    product = listing.to_public_dict()
    if quantity < product["minOrderKg"] or quantity > product["stockAvailableKg"]:
        return jsonify({"error": "La cantidad debe respetar el pedido mínimo y el inventario disponible."}), 400
    if freight < 0 or freight > 100_000_000:
        return jsonify({"error": "El costo de transporte no es válido."}), 400
    destination = str(payload.get("destinationZone", ""))
    destinations = {"Local Córdoba", "Medellín / Antioquia", "Bogotá D.C.", "Costa Caribe", "Internacional"}
    if destination not in destinations:
        return jsonify({"error": "Selecciona un destino válido."}), 400
    discount = 10 if quantity >= 5000 else 7 if quantity >= 2000 else 4 if quantity >= 500 else 0
    subtotal = quantity * product["priceCopKg"] * (1 - discount / 100)
    total = subtotal + freight
    producer = db.session.get(User, listing.producer_id)
    quotation = QuotationRecord(
        client_id=user.id,
        producer_id=listing.producer_id,
        product_id=listing.id,
        product_listing_id=listing.id,
        product_name=product["name"].split()[0],
        product_variety=product["variety"],
        producer_name=producer.name,
        producer_association=producer.association or "Independiente",
        producer_whatsapp="".join(char for char in (producer.phone or "") if char.isdigit()),
        client_name=user.name,
        client_email=user.email,
        client_phone=user.phone,
        client_business_type=user.business_type,
        client_city=user.city,
        quantity_kg=quantity,
        destination_zone=destination,
        freight_cop=freight,
        subtotal_cop=subtotal,
        total_cop=total,
        exchange_rate_cop=4150,
        discount_percent=discount,
        notes=str(payload.get("notes", "")).strip()[:1000],
    )
    db.session.add(quotation)
    db.session.commit()
    return jsonify({"quotation": quotation.to_public_dict()}), 201


@app.patch("/api/quotations/<string:quotation_id>")
def update_quotation_status(quotation_id):
    user = _current_user()
    if user is None:
        return jsonify({"error": "Inicia sesión para actualizar la cotización."}), 401
    if user.role != "productor":
        return jsonify({"error": "Solo el productor puede actualizar el estado."}), 403
    if user.status != "activo":
        return jsonify({"error": "Tu cuenta no está aprobada para gestionar cotizaciones."}), 403
    quotation = db.session.get(QuotationRecord, quotation_id)
    if quotation is None:
        return jsonify({"error": "No se encontró la cotización."}), 404
    if quotation.producer_id != user.id:
        return jsonify({"error": "No tienes permiso para cambiar esta cotización."}), 403
    payload = request.get_json(silent=True) or {}
    status = str(payload.get("status", ""))
    if status not in {"Pendiente", "Cotizado", "Contactado WhatsApp", "Cerrado"}:
        return jsonify({"error": "El estado indicado no es válido."}), 400
    quotation.status = status
    db.session.commit()
    return jsonify({"quotation": quotation.to_public_dict()})


@app.get("/api/favorites")
def list_favorites():
    user = _current_user()
    if user is None or user.role != "cliente":
        return jsonify({"error": "Inicia sesión como comprador para consultar favoritos."}), 403
    ids = [row.product_id for row in Favorite.query.filter_by(user_id=user.id).all()]
    return jsonify({"favoriteIds": ids})


@app.put("/api/favorites")
def replace_favorites():
    user = _current_user()
    if user is None or user.role != "cliente":
        return jsonify({"error": "Inicia sesión como comprador para guardar favoritos."}), 403
    payload = request.get_json(silent=True) or {}
    ids = payload.get("favoriteIds") if isinstance(payload, dict) else None
    if not isinstance(ids, list) or len(ids) > 500 or any(
        not isinstance(item, str) or not item.strip() or len(item) > 120 for item in ids
    ):
        return jsonify({"error": "La lista de favoritos no es válida."}), 400
    Favorite.query.filter_by(user_id=user.id).delete()
    db.session.add_all(
        Favorite(user_id=user.id, product_id=product_id)
        for product_id in dict.fromkeys(ids)
    )
    db.session.commit()
    return jsonify({"favoriteIds": list(dict.fromkeys(ids))})


@app.get("/api/notifications/read")
def list_read_notifications():
    user = _current_user()
    if user is None or user.role != "cliente":
        return jsonify({"error": "Inicia sesión como comprador para consultar tus avisos."}), 403
    ids = [row.quotation_id for row in ReadNotification.query.filter_by(user_id=user.id).all()]
    return jsonify({"quotationIds": ids})


@app.put("/api/notifications/read")
def mark_notifications_read():
    user = _current_user()
    if user is None or user.role != "cliente":
        return jsonify({"error": "Inicia sesión como comprador para actualizar tus avisos."}), 403
    payload = request.get_json(silent=True) or {}
    ids = payload.get("quotationIds") if isinstance(payload, dict) else None
    if not isinstance(ids, list) or len(ids) > 500 or any(not isinstance(item, str) for item in ids):
        return jsonify({"error": "La lista de avisos no es válida."}), 400
    owned_ids = set()
    if ids:
        owned_ids = {
            row[0] for row in db.session.query(QuotationRecord.id).filter(
                QuotationRecord.client_id == user.id,
                QuotationRecord.id.in_(set(ids)),
            ).all()
        }
    existing = set()
    if owned_ids:
        existing = {
            row.quotation_id for row in ReadNotification.query.filter(
                ReadNotification.user_id == user.id,
                ReadNotification.quotation_id.in_(owned_ids),
            ).all()
        }
    db.session.add_all(
        ReadNotification(user_id=user.id, quotation_id=quotation_id)
        for quotation_id in owned_ids - existing
    )
    db.session.commit()
    return jsonify({"quotationIds": sorted(existing | owned_ids)})


@app.get("/api/admin/users")
def admin_list_users():
    user = _current_user()
    if user is None or user.role != "admin":
        return jsonify({"error": "Se requiere una sesión de administrador."}), 403
    accounts = User.query.filter(User.role != "admin").order_by(User.registered_at.desc()).all()
    return jsonify({"users": [account.to_public_dict() for account in accounts]})


@app.patch("/api/admin/users/<string:user_id>/status")
def admin_update_user_status(user_id):
    admin = _current_user()
    if admin is None or admin.role != "admin":
        return jsonify({"error": "Se requiere una sesión de administrador."}), 403
    account = db.session.get(User, user_id)
    if account is None or account.role == "admin":
        return jsonify({"error": "No se encontró la cuenta que deseas cambiar."}), 404
    status = str((request.get_json(silent=True) or {}).get("status", ""))
    if status not in {"pendiente", "activo", "inactivo"}:
        return jsonify({"error": "El estado de la cuenta no es válido."}), 400
    account.status = status
    db.session.commit()
    return jsonify({"user": account.to_public_dict()})


@app.patch("/api/admin/users/<string:user_id>")
def admin_edit_user(user_id):
    admin = _current_user()
    if admin is None or admin.role != "admin":
        return jsonify({"error": "Se requiere una sesión de administrador."}), 403
    account = db.session.get(User, user_id)
    if account is None or account.role == "admin":
        return jsonify({"error": "No se encontró la cuenta que deseas editar."}), 404
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Los datos de la cuenta no son válidos."}), 400
    name = str(payload.get("name", account.name)).strip()
    email = str(payload.get("email", account.email)).strip().lower()
    phone = str(payload.get("phone", account.phone)).strip()
    city = str(payload.get("city", account.city)).strip()
    status = str(payload.get("status", account.status))
    if not name or len(name) > 160 or len(email) > 320 or "@" not in email or "." not in email.rsplit("@", 1)[-1]:
        return jsonify({"error": "El nombre o correo no son válidos."}), 400
    if User.query.filter(User.email == email, User.id != account.id).first():
        return jsonify({"error": "Ese correo ya está registrado."}), 409
    if phone and not 10 <= len("".join(char for char in phone if char.isdigit())) <= 13:
        return jsonify({"error": "El teléfono no es válido."}), 400
    if not city or len(city) > 100 or status not in {"pendiente", "activo", "inactivo"}:
        return jsonify({"error": "El municipio o estado de la cuenta no son válidos."}), 400
    account.name, account.email, account.phone, account.city, account.status = name, email, phone, city, status
    if account.role == "productor":
        farm_name = str(payload.get("farmName", account.farm_name)).strip()
        association = str(payload.get("association", account.association)).strip()
        products = payload.get(
            "products",
            [item.name for item in ProducerProduct.query.filter_by(user_id=account.id).order_by(ProducerProduct.id).all()],
        )
        if len(farm_name) > 160 or len(association) > 200 or not isinstance(products, list) or len(products) > 30 or any(not isinstance(item, str) or len(item) > 100 for item in products):
            return jsonify({"error": "Los datos de finca, asociación o productos no son válidos."}), 400
        account.farm_name, account.association = farm_name, association
        ProducerProduct.query.filter_by(user_id=account.id).delete()
        db.session.add_all(
            ProducerProduct(user_id=account.id, name=name)
            for name in dict.fromkeys(item.strip() for item in products if item.strip())
        )
    else:
        business_type = str(payload.get("businessType", account.business_type))
        if business_type not in {"Hogar", "Restaurante", "Distribuidor", "Importador"}:
            return jsonify({"error": "El tipo de negocio no es válido."}), 400
        account.business_type = business_type
    db.session.commit()
    return jsonify({"user": account.to_public_dict()})


@app.delete("/api/admin/users/<string:user_id>")
def admin_delete_user(user_id):
    admin = _current_user()
    if admin is None or admin.role != "admin":
        return jsonify({"error": "Se requiere una sesión de administrador."}), 403
    account = db.session.get(User, user_id)
    if account is None or account.role == "admin":
        return jsonify({"error": "No se encontró la cuenta que deseas eliminar."}), 404
    QuotationRecord.query.filter(
        (QuotationRecord.client_id == account.id) | (QuotationRecord.producer_id == account.id)
    ).delete(synchronize_session=False)
    ProductListing.query.filter_by(producer_id=account.id).delete(synchronize_session=False)
    Favorite.query.filter_by(user_id=account.id).delete(synchronize_session=False)
    ReadNotification.query.filter_by(user_id=account.id).delete(synchronize_session=False)
    AccountSettings.query.filter_by(user_id=account.id).delete(synchronize_session=False)
    SettingsVerification.query.filter_by(user_id=account.id).delete(synchronize_session=False)
    PasswordResetVerification.query.filter_by(user_id=account.id).delete(synchronize_session=False)
    db.session.delete(account)
    db.session.commit()
    return jsonify({"ok": True})


def _current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    user = db.session.get(User, user_id)
    if user is None:
        session.clear()
    return user


def _user_payload(user):
    return {"user": user.to_public_dict()}


def _validate_registration(payload):
    if not isinstance(payload, dict):
        return None, "Los datos de registro no son válidos.", 400
    name = str(payload.get("name", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))
    role = str(payload.get("role", "cliente"))
    gender = str(payload.get("gender", "neutro"))
    phone = str(payload.get("phone", "")).strip()
    city = str(payload.get("city", "")).strip()
    business_type = str(payload.get("businessType", "Hogar"))
    farm_name = str(payload.get("farmName", "")).strip()
    association = str(payload.get("association", "")).strip()
    products = payload.get("products", [])

    if not name or len(name) > 160:
        return None, "Escribe un nombre válido.", 400
    if len(email) > 320 or "@" not in email or "." not in email.rsplit("@", 1)[-1]:
        return None, "Escribe un correo electrónico válido.", 400
    if len(password) < 8:
        return None, "La contraseña debe tener al menos 8 caracteres.", 400
    if role not in ("cliente", "productor"):
        return None, "El tipo de cuenta no es válido.", 400
    if gender not in ("masculino", "femenino", "neutro"):
        return None, "Selecciona una opción de saludo válida.", 400
    if role == "productor" and (not farm_name or not association or not isinstance(products, list) or not products):
        return None, "Completa los datos de tu finca, asociación y productos.", 400
    if not isinstance(products, list) or any(not isinstance(item, str) for item in products):
        return None, "La lista de productos no es válida.", 400

    return {
        "name": name,
        "email": email,
        "password": password,
        "role": role,
        "gender": gender,
        "phone": phone,
        "city": city or "Montería",
        "business_type": business_type,
        "farm_name": farm_name,
        "association": association,
        "producer_products": list(dict.fromkeys(item.strip()[:100] for item in products if item.strip()))[:30],
    }, None, None


@app.post("/api/auth/register")
def register_local_user():
    payload, error, status = _validate_registration(request.get_json(silent=True) or {})
    if error:
        return jsonify({"error": error}), status
    if User.query.filter_by(email=payload["email"]).first():
        return jsonify({"error": "Ya existe una cuenta con ese correo electrónico."}), 409

    user = User(
        google_sub=f"local:{uuid.uuid4()}",
        email=payload["email"],
        name=payload["name"],
        password_hash=generate_password_hash(payload["password"]),
        role=payload["role"],
        gender=payload["gender"],
        phone=payload["phone"],
        city=payload["city"],
        business_type=payload["business_type"],
        farm_name=payload["farm_name"],
        association=payload["association"],
        status="pendiente" if payload["role"] == "productor" else "activo",
    )
    db.session.add(user)
    try:
        db.session.flush()
        db.session.add_all(
            ProducerProduct(user_id=user.id, name=product_name)
            for product_name in payload["producer_products"]
        )
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        if User.query.filter_by(email=payload["email"]).first():
            return jsonify({"error": "Ya existe una cuenta con ese correo electrónico."}), 409
        raise
    session.clear()
    session["user_id"] = user.id
    return jsonify(_user_payload(user)), 201


@app.post("/api/auth/login")
def login_local_user():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))
    user = User.query.filter_by(email=email).first()
    if user is None or not user.password_hash or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "El correo o la contraseña no son correctos."}), 401
    if user.status == "inactivo":
        return jsonify({"error": "Esta cuenta está desactivada. Contacta al administrador."}), 403
    session.clear()
    session["user_id"] = user.id
    return jsonify(_user_payload(user))


def _code_hash(code):
    secret = str(app.config["SECRET_KEY"]).encode("utf-8")
    return hmac.new(secret, code.encode("utf-8"), hashlib.sha256).hexdigest()


def _send_password_reset_code(user, code):
    _send_email_code(
        user,
        "Código para recuperar tu contraseña de AgroCórdoba",
        f"Hola {user.name},\n\nTu código para crear una nueva contraseña es: {code}\n\nVence en 10 minutos. Si no solicitaste este cambio, ignora este correo.",
    )


def _send_settings_code(user, code):
    _send_email_code(
        user,
        "Código para confirmar cambios en AgroCórdoba",
        f"Hola {user.name},\n\nTu código para confirmar los cambios de tu cuenta es: {code}\n\nVence en 10 minutos. Si no solicitaste este cambio, ignora este correo.",
    )


def _send_email_code(user, subject, content):
    sender = os.environ.get("RESEND_FROM", os.environ.get("SMTP_FROM", "")).strip()
    if not sender:
        raise RuntimeError("Email delivery sender is not configured.")

    api_key = os.environ.get("RESEND_API_KEY", "").strip()
    if api_key:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"from": sender, "to": [user.email], "subject": subject, "text": content},
            timeout=20,
        )
        response.raise_for_status()
        return

    host = os.environ.get("SMTP_HOST", "").strip()
    if not host:
        raise RuntimeError("Configure Resend or SMTP for email delivery.")
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = sender
    message["To"] = user.email
    message.set_content(content)
    port = int(os.environ.get("SMTP_PORT", "587"))
    username = os.environ.get("SMTP_USERNAME", "").strip()
    password = os.environ.get("SMTP_PASSWORD", "")
    use_ssl = os.environ.get("SMTP_USE_SSL", "false").lower() == "true"
    use_tls = os.environ.get("SMTP_USE_TLS", "true").lower() == "true"
    smtp_class = smtplib.SMTP_SSL if use_ssl else smtplib.SMTP
    with smtp_class(host, port, timeout=20) as smtp:
        if use_tls and not use_ssl:
            smtp.starttls()
        if username:
            smtp.login(username, password)
        smtp.send_message(message)


@app.post("/api/auth/password/request-code")
def request_password_reset_code():
    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        return jsonify({"error": "Invalid request data."}), 400
    email = str(payload.get("email", "")).strip().lower()
    if len(email) > 320 or "@" not in email:
        return jsonify({"error": "Escribe el correo de tu cuenta."}), 400

    user = User.query.filter_by(email=email).first()
    if user is None:
        return jsonify({"ok": True, "message": "Si la cuenta existe, enviaremos un codigo."})

    now = datetime.now(timezone.utc)
    challenge = PasswordResetVerification.query.filter_by(user_id=user.id).first()
    if challenge and challenge.sent_at.replace(tzinfo=timezone.utc) > now - timedelta(seconds=60):
        return jsonify({"error": "Espera un minuto antes de pedir otro codigo."}), 429

    code = f"{secrets.randbelow(1_000_000):06d}"
    try:
        _send_password_reset_code(user, code)
    except (OSError, requests.RequestException, smtplib.SMTPException, RuntimeError, ValueError):
        app.logger.exception("Password recovery email could not be sent")
        return jsonify({"error": "No se pudo enviar el correo. Configura el proveedor de correo e inténtalo de nuevo."}), 503

    if challenge is None:
        challenge = PasswordResetVerification(user_id=user.id)
        db.session.add(challenge)
    challenge.code_hash = _code_hash(code)
    challenge.sent_at = now
    challenge.expires_at = now + timedelta(minutes=10)
    challenge.attempts = 0
    db.session.commit()
    return jsonify({"ok": True, "message": "Si la cuenta existe, enviaremos un codigo."})


@app.post("/api/auth/password/verify-code")
def reset_password_with_code():
    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        return jsonify({"error": "Invalid request data."}), 400
    email = str(payload.get("email", "")).strip().lower()
    code = str(payload.get("code", "")).strip()
    password = str(payload.get("password", ""))
    if not re.fullmatch(r"\d{6}", code):
        return jsonify({"error": "El código debe tener seis dígitos."}), 400
    if len(password) < 8 or len(password) > 256:
        return jsonify({"error": "La contrasena nueva debe tener entre 8 y 256 caracteres."}), 400

    user = User.query.filter_by(email=email).first()
    challenge = PasswordResetVerification.query.filter_by(user_id=user.id).first() if user else None
    if challenge is None:
        return jsonify({"error": "Solicita primero un codigo de recuperacion."}), 400
    if challenge.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        db.session.delete(challenge)
        db.session.commit()
        return jsonify({"error": "El codigo vencio. Solicita uno nuevo."}), 400
    if challenge.attempts >= 5:
        return jsonify({"error": "Superaste los intentos permitidos. Solicita un codigo nuevo."}), 429
    if not hmac.compare_digest(challenge.code_hash, _code_hash(code)):
        challenge.attempts += 1
        db.session.commit()
        return jsonify({"error": "El codigo no coincide."}), 400

    user.password_hash = generate_password_hash(password)
    db.session.delete(challenge)
    db.session.commit()
    return jsonify({"ok": True, "message": "Contrasena actualizada. Ya puedes iniciar sesion."})


@app.post("/api/account/settings/request-code")
def request_settings_code():
    user = _current_user()
    if user is None:
        return jsonify({"error": "Inicia sesión de nuevo para cambiar tu configuración."}), 401

    payload = request.get_json(silent=True) or {}
    changes = {}
    if "email" in payload:
        email = str(payload["email"]).strip().lower()
        if len(email) > 320 or "@" not in email or "." not in email.rsplit("@", 1)[-1]:
            return jsonify({"error": "Escribe un correo electrónico válido."}), 400
        existing = User.query.filter(User.email == email, User.id != user.id).first()
        if existing:
            return jsonify({"error": "Ese correo ya está registrado."}), 409
        changes["email"] = email
    if "name" in payload:
        name = str(payload["name"]).strip()
        if not name or len(name) > 160:
            return jsonify({"error": "El nombre debe tener entre 1 y 160 caracteres."}), 400
        changes["name"] = name
    if "phone" in payload:
        phone = str(payload["phone"]).strip()
        digits = "".join(char for char in phone if char.isdigit())
        if phone and not 10 <= len(digits) <= 13:
            return jsonify({"error": "Escribe un número de teléfono válido."}), 400
        changes["phone"] = phone
    if "notifications" in payload:
        prefs = payload["notifications"]
        fields = ("notificationsEnabled", "quoteNotifications", "responseNotifications")
        if not isinstance(prefs, dict) or any(not isinstance(prefs.get(key), bool) for key in fields):
            return jsonify({"error": "Las preferencias de notificación no son válidas."}), 400
        changes["notifications"] = prefs
    if not changes:
        return jsonify({"error": "No hay cambios para confirmar."}), 400

    now = datetime.now(timezone.utc)
    challenge = SettingsVerification.query.filter_by(user_id=user.id).first()
    if challenge and challenge.sent_at.replace(tzinfo=timezone.utc) > now - timedelta(seconds=60):
        return jsonify({"error": "Espera un minuto antes de pedir otro código."}), 429

    code = f"{secrets.randbelow(1_000_000):06d}"
    try:
        _send_settings_code(user, code)
    except (OSError, requests.RequestException, smtplib.SMTPException, RuntimeError, ValueError):
        app.logger.exception("No se pudo enviar el código de configuración")
        return jsonify({"error": "No se pudo enviar el correo. Revisa la configuración del proveedor e inténtalo de nuevo."}), 503

    if challenge is None:
        challenge = SettingsVerification(user_id=user.id)
        db.session.add(challenge)
    challenge.code_hash = _code_hash(code)
    challenge.sent_at = now
    challenge.expires_at = now + timedelta(minutes=10)
    challenge.attempts = 0
    challenge.pending_email = changes.get("email")
    challenge.pending_name = changes.get("name")
    challenge.pending_phone = changes.get("phone")
    prefs = changes.get("notifications")
    challenge.pending_notifications_enabled = (
        prefs["notificationsEnabled"] if prefs is not None else None
    )
    challenge.pending_quote_notifications = (
        prefs["quoteNotifications"] if prefs is not None else None
    )
    challenge.pending_response_notifications = (
        prefs["responseNotifications"] if prefs is not None else None
    )
    db.session.flush()
    db.session.commit()
    return jsonify({"ok": True, "email": user.email, "expiresInSeconds": 600})


@app.get("/api/account/settings")
def get_account_settings():
    user = _current_user()
    if user is None:
        return jsonify({"error": "Inicia sesión para consultar tu configuración."}), 401
    settings = AccountSettings.query.filter_by(user_id=user.id).first()
    return jsonify({
        "phone": user.phone,
        "notifications": {
            "notificationsEnabled": settings.notifications_enabled if settings else True,
            "quoteNotifications": settings.quote_notifications if settings else True,
            "responseNotifications": settings.response_notifications if settings else True,
        },
    })


@app.patch("/api/account/profile")
def update_account_profile():
    user = _current_user()
    if user is None:
        return jsonify({"error": "Inicia sesión para actualizar tu perfil."}), 401
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Los datos del perfil no son válidos."}), 400
    allowed = {"avatar", "city", "farmName", "association", "businessType"}
    if not payload or set(payload) - allowed:
        return jsonify({"error": "El perfil incluye campos que no se pueden modificar aquí."}), 400
    if "avatar" in payload:
        avatar = payload["avatar"]
        if not isinstance(avatar, str) or len(avatar) > 1_500_000:
            return jsonify({"error": "La foto supera el tamaño permitido."}), 400
        if avatar and avatar.startswith("data:"):
            try:
                header, encoded = avatar.split(",", 1)
                if header not in {"data:image/jpeg;base64", "data:image/png;base64", "data:image/webp;base64"}:
                    raise ValueError("unsupported image type")
                image_bytes = base64.b64decode(encoded, validate=True)
                if not image_bytes or len(image_bytes) > 1_000_000:
                    raise ValueError("unsupported image size")
            except (ValueError, binascii.Error):
                return jsonify({"error": "La foto debe ser JPG, PNG o WebP y no superar 1 MB."}), 400
        elif avatar and not avatar.startswith("https://"):
            return jsonify({"error": "La dirección de la foto no es válida."}), 400
        user.avatar = avatar
    if "city" in payload:
        city = payload["city"]
        if not isinstance(city, str) or not city.strip() or len(city.strip()) > 100:
            return jsonify({"error": "Selecciona un municipio válido."}), 400
        user.city = city.strip()
    if "businessType" in payload:
        business_type = payload["businessType"]
        if user.role != "cliente" or business_type not in {"Hogar", "Restaurante", "Distribuidor", "Importador"}:
            return jsonify({"error": "El tipo de negocio no es válido para esta cuenta."}), 400
        user.business_type = business_type
    if "farmName" in payload or "association" in payload:
        if user.role != "productor":
            return jsonify({"error": "Solo el productor puede actualizar los datos de su finca."}), 403
        farm_name = payload.get("farmName", user.farm_name)
        association = payload.get("association", user.association)
        if not isinstance(farm_name, str) or len(farm_name.strip()) > 160:
            return jsonify({"error": "El nombre de la finca no puede superar 160 caracteres."}), 400
        if not isinstance(association, str) or len(association.strip()) > 200:
            return jsonify({"error": "La asociación no puede superar 200 caracteres."}), 400
        user.farm_name = farm_name.strip()
        user.association = association.strip()
    db.session.commit()
    return jsonify({"user": user.to_public_dict()})


@app.post("/api/account/settings/verify-code")
def verify_settings_code():
    user = _current_user()
    if user is None:
        return jsonify({"error": "Inicia sesión de nuevo para cambiar tu configuración."}), 401
    payload = request.get_json(silent=True) or {}
    code = str(payload.get("code", "")).strip()
    challenge = SettingsVerification.query.filter_by(user_id=user.id).first()
    if challenge is None:
        return jsonify({"error": "Solicita un código antes de confirmar."}), 400
    if challenge.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        db.session.delete(challenge)
        db.session.commit()
        return jsonify({"error": "El código venció. Solicita uno nuevo."}), 400
    if challenge.attempts >= 5:
        return jsonify({"error": "Superaste los intentos permitidos. Solicita un código nuevo."}), 429
    if not hmac.compare_digest(challenge.code_hash, _code_hash(code)):
        challenge.attempts += 1
        db.session.commit()
        return jsonify({"error": "El código no coincide."}), 400

    changes = {}
    if challenge.pending_email is not None:
        changes["email"] = challenge.pending_email
    if challenge.pending_name is not None:
        changes["name"] = challenge.pending_name
    if challenge.pending_phone is not None:
        changes["phone"] = challenge.pending_phone
    if challenge.pending_notifications_enabled is not None:
        changes["notifications"] = {
            "notificationsEnabled": challenge.pending_notifications_enabled,
            "quoteNotifications": challenge.pending_quote_notifications,
            "responseNotifications": challenge.pending_response_notifications,
        }
    if "email" in changes:
        duplicate = User.query.filter(User.email == changes["email"], User.id != user.id).first()
        if duplicate:
            db.session.delete(challenge)
            db.session.commit()
            return jsonify({"error": "Ese correo ya está registrado."}), 409
        user.email = changes["email"]
    if "name" in changes:
        user.name = changes["name"]

    settings = AccountSettings.query.filter_by(user_id=user.id).first()
    if settings is None:
        settings = AccountSettings(user_id=user.id)
        db.session.add(settings)
    if "phone" in changes:
        user.phone = changes["phone"]
    if "notifications" in changes:
        prefs = changes["notifications"]
        settings.notifications_enabled = prefs["notificationsEnabled"]
        settings.quote_notifications = prefs["quoteNotifications"]
        settings.response_notifications = prefs["responseNotifications"]

    db.session.delete(challenge)
    db.session.commit()
    return jsonify({
        "ok": True,
        "user": user.to_public_dict(),
        "notifications": {
            "notificationsEnabled": settings.notifications_enabled,
            "quoteNotifications": settings.quote_notifications,
            "responseNotifications": settings.response_notifications,
        },
    })


def frontend_url(status):
    base = os.environ.get("FRONTEND_URL")
    if not base:
        render_url = os.environ.get("RENDER_EXTERNAL_URL", "").rstrip("/")
        base = f"{render_url}/" if render_url else "http://localhost:3000/"
    return f"{base}?{urlencode({'google_login': status})}"


@app.get("/auth/google")
def google_login():
    if not os.environ.get("GOOGLE_CLIENT_ID") or not os.environ.get("GOOGLE_CLIENT_SECRET"):
        return redirect(frontend_url("setup"))

    redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI")
    if not redirect_uri:
        render_url = os.environ.get("RENDER_EXTERNAL_URL", "").rstrip("/")
        redirect_uri = (
            f"{render_url}/auth/google/callback"
            if render_url
            else "http://localhost:5000/auth/google/callback"
        )
    return google.authorize_redirect(redirect_uri)


@app.get("/auth/google/callback")
def google_callback():
    try:
        token = google.authorize_access_token()
        profile = token.get("userinfo") or {}
        subject = profile.get("sub")
        email = (profile.get("email") or "").strip().lower()

        if not subject or not email or profile.get("email_verified") is not True:
            session.clear()
            return redirect(frontend_url("error"))

        user = User.query.filter_by(google_sub=subject).first()
        if user is None:
            user = User.query.filter_by(email=email).first()

        if user is None:
            user = User(
                google_sub=subject,
                email=email,
                name=(profile.get("name") or email.split("@")[0])[:160],
                avatar=profile.get("picture", ""),
            )
            db.session.add(user)
        else:
            user.google_sub = subject
            # El nombre y la foto pueden haber sido editados desde el perfil.
            # No los sobreescribimos en cada inicio de sesión con los valores de Google.

        db.session.commit()
        session.clear()
        session["user_id"] = user.id
        return redirect(frontend_url("success"))
    except Exception:
        db.session.rollback()
        session.clear()
        app.logger.exception("Falló el inicio de sesión con Google")
        return redirect(frontend_url("error"))


@app.get("/api/auth/me")
def current_user():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "No hay una sesión iniciada."}), 401

    user = db.session.get(User, user_id)
    if user is None:
        session.clear()
        return jsonify({"error": "La sesión ya no es válida."}), 401

    return jsonify({"user": user.to_public_dict()})


@app.post("/api/auth/logout")
def logout():
    session.clear()
    return jsonify({"ok": True})


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


def _frontend_index_content():
    dist_dir = os.environ.get("FRONTEND_DIST_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist")))
    index_path = os.path.join(dist_dir, "index.html")
    if not os.path.isfile(index_path):
        return None
    with open(index_path, encoding="utf-8") as index_file:
        return index_file.read()


def _product_slug(name):
    normalized_name = unicodedata.normalize("NFD", name)
    ascii_name = "".join(char for char in normalized_name if not unicodedata.combining(char))
    return re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", ascii_name.lower()))


def _product_structured_data(product, product_url):
    image = product.get("image", "")
    if image and not image.startswith(("http://", "https://")):
        image = f"{request.url_root.rstrip('/')}/{image.lstrip('/')}"
    product_data = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product["name"],
        "description": product.get("description", ""),
        "image": image,
        "sku": product["id"],
        "category": product.get("category", ""),
        "url": product_url,
        "brand": {"@type": "Brand", "name": "AgroCórdoba"},
        "offers": {
            "@type": "Offer",
            "url": product_url,
            "priceCurrency": "COP",
            "price": product["priceCopKg"],
            "priceSpecification": {
                "@type": "UnitPriceSpecification",
                "price": product["priceCopKg"],
                "priceCurrency": "COP",
                "unitCode": "KGM",
                "referenceQuantity": {
                    "@type": "QuantitativeValue",
                    "value": 1,
                    "unitCode": "KGM",
                },
            },
            "availability": (
                "https://schema.org/InStock"
                if product.get("stockAvailableKg", 0) > 0
                else "https://schema.org/OutOfStock"
            ),
            "seller": {"@type": "Person", "name": product["producerName"]},
            "areaServed": {
                "@type": "City",
                "name": product.get("municipalityName", ""),
            },
        },
    }
    return product_data


@app.get("/producto/<slug>/<string:product_id>")
def frontend_product_page(slug, product_id):
    index_html = _frontend_index_content()
    if index_html is None:
        return jsonify({"error": "El frontend todavía no está compilado."}), 404

    listing = (
        ProductListing.query.join(User, ProductListing.producer_id == User.id)
        .filter(ProductListing.id == product_id, User.status == "activo")
        .first()
    )
    if listing is None:
        return app.response_class(index_html, content_type="text/html; charset=utf-8")

    product = listing.to_public_dict()
    product_url = (
        f"{request.url_root.rstrip('/')}/producto/"
        f"{_product_slug(product['name'])}/{quote(product_id, safe='')}"
    )
    title = f"{product['name']} en {product.get('municipalityName', 'Córdoba')} | AgroCórdoba"
    description = product.get("description") or f"{product['name']} ofrecido por productores de Córdoba."
    escaped_title = html.escape(title, quote=True)
    escaped_description = html.escape(description, quote=True)
    escaped_url = html.escape(product_url, quote=True)
    image = product.get("image", "")
    if image and not image.startswith(("http://", "https://")):
        image = f"{request.url_root.rstrip('/')}/{image.lstrip('/')}"
    escaped_image = html.escape(image, quote=True)
    structured_data = json.dumps(
        _product_structured_data(product, product_url),
        ensure_ascii=False,
    ).replace("<", "\\u003c")

    replacements = (
        (r"<title>.*?</title>", f"<title>{escaped_title}</title>"),
        (
            r'<meta name="description"[^>]*>',
            f'<meta name="description" content="{escaped_description}" />',
        ),
        (
            r'<link rel="canonical"[^>]*>',
            f'<link rel="canonical" href="{escaped_url}" />',
        ),
        (
            r'<meta property="og:url"[^>]*>',
            f'<meta property="og:url" content="{escaped_url}" />',
        ),
        (
            r'<meta property="og:title"[^>]*>',
            f'<meta property="og:title" content="{escaped_title}" />',
        ),
        (
            r'<meta property="og:description"[^>]*>',
            f'<meta property="og:description" content="{escaped_description}" />',
        ),
        (
            r'<meta property="og:image"[^>]*>',
            f'<meta property="og:image" content="{escaped_image}" />',
        ),
    )
    for pattern, replacement in replacements:
        index_html = re.sub(pattern, lambda _: replacement, index_html, count=1, flags=re.IGNORECASE)

    price = f"{int(product['priceCopKg']):,}".replace(",", ".")
    server_content = (
        f'<main><article><h1>{html.escape(product["name"])}</h1>'
        f'<p>{html.escape(description)}</p>'
        f'<p>Precio de referencia: $ {price} COP por kilogramo.</p>'
        f'<p>Productor: {html.escape(product["producerName"])}. '
        f'Origen: {html.escape(product.get("municipalityName", "Córdoba"))}.</p>'
        "</article></main>"
    )
    index_html = index_html.replace('<div id="root"></div>', f'<div id="root">{server_content}</div>', 1)
    index_html = index_html.replace(
        "</head>",
        f'<script id="product-structured-data" type="application/ld+json">{structured_data}</script></head>',
        1,
    )
    return app.response_class(index_html, content_type="text/html; charset=utf-8")


@app.get("/sitemap.xml")
def frontend_sitemap():
    base_url = request.url_root.rstrip("/")
    listings = (
        ProductListing.query.join(User, ProductListing.producer_id == User.id)
        .filter(User.status == "activo")
        .order_by(ProductListing.created_at.desc())
        .all()
    )
    locations = [f"{base_url}/"]
    locations.extend(
        f"{base_url}/producto/{_product_slug(listing.name)}/{quote(listing.id, safe='')}"
        for listing in listings
    )
    sitemap = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        + "".join(f"<url><loc>{html.escape(location)}</loc></url>" for location in locations)
        + "</urlset>"
    )
    return app.response_class(sitemap, content_type="application/xml; charset=utf-8")


@app.get("/")
def frontend_index():
    index_html = _frontend_index_content()
    if index_html is None:
        return jsonify({"error": "El frontend todavía no está compilado."}), 404
    return app.response_class(index_html, content_type="text/html; charset=utf-8")


@app.get("/<path:frontend_path>")
def frontend_assets_and_routes(frontend_path):
    if frontend_path.startswith(("api/", "auth/")):
        return jsonify({"error": "No se encontró la ruta solicitada."}), 404
    dist_dir = os.environ.get("FRONTEND_DIST_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist")))
    requested_path = os.path.join(dist_dir, frontend_path)
    if os.path.isfile(requested_path):
        return send_from_directory(dist_dir, frontend_path)
    index_path = os.path.join(dist_dir, "index.html")
    if os.path.isfile(index_path):
        return send_from_directory(dist_dir, "index.html")
    return jsonify({"error": "El frontend todavía no está compilado."}), 404


def _migrate_user_columns():
    """Adds local-auth/profile fields to databases created by the earlier backend."""
    columns = {column["name"] for column in inspect(db.engine).get_columns("user")}
    additions = {
        "password_hash": "VARCHAR(255) NULL",
        "gender": "VARCHAR(20) NOT NULL DEFAULT 'neutro'",
        "phone": "VARCHAR(30) NOT NULL DEFAULT ''",
        "farm_name": "VARCHAR(160) NOT NULL DEFAULT ''",
        "association": "VARCHAR(200) NOT NULL DEFAULT ''",
        "status": "VARCHAR(20) NOT NULL DEFAULT 'activo'",
    }
    for name, sql_type in additions.items():
        if name not in columns:
            db.session.execute(text(f'ALTER TABLE "user" ADD COLUMN {name} {sql_type}'))
    db.session.commit()


def _ensure_columns(table_name, additions):
    columns = {column["name"] for column in inspect(db.engine).get_columns(table_name)}
    for name, sql_type in additions.items():
        if name not in columns:
            db.session.execute(
                text(f'ALTER TABLE "{table_name}" ADD COLUMN "{name}" {sql_type}')
            )


def _drop_legacy_column(table_name, column_name):
    columns = {column["name"] for column in inspect(db.engine).get_columns(table_name)}
    if column_name in columns:
        db.session.execute(
            text(f'ALTER TABLE "{table_name}" DROP COLUMN "{column_name}"')
        )
        db.session.commit()


def _decode_legacy_object(value, table_name, row_id):
    if isinstance(value, str):
        value = json.loads(value)
    if not isinstance(value, dict):
        raise RuntimeError(
            f"Cannot migrate {table_name} row {row_id}: expected a JSON object."
        )
    return value


def _migrate_normalized_tables():
    """Moves legacy JSON and duplicate phone fields into relational columns."""
    user_columns = {column["name"] for column in inspect(db.engine).get_columns("user")}
    if "producer_products" in user_columns:
        rows = db.session.execute(
            text('SELECT id, producer_products FROM "user"')
        ).all()
        existing = {
            (row.user_id, row.name)
            for row in ProducerProduct.query.with_entities(
                ProducerProduct.user_id,
                ProducerProduct.name,
            ).all()
        }
        for row in rows:
            values = row.producer_products
            if isinstance(values, str):
                values = json.loads(values)
            if values is None:
                values = []
            if not isinstance(values, list) or any(not isinstance(item, str) for item in values):
                raise RuntimeError(
                    f"Cannot migrate producer products for user {row.id}: expected a string list."
                )
            for name in dict.fromkeys(item.strip() for item in values if item.strip()):
                if (row.id, name) not in existing:
                    db.session.add(ProducerProduct(user_id=row.id, name=name[:100]))
                    existing.add((row.id, name))
        db.session.commit()
        _drop_legacy_column("user", "producer_products")

    _ensure_columns(
        "product_listing",
        {
            "name": "VARCHAR(120) NOT NULL DEFAULT ''",
            "variety": "VARCHAR(120) NOT NULL DEFAULT ''",
            "category": "VARCHAR(60) NOT NULL DEFAULT ''",
            "price_cop_kg": "FLOAT NOT NULL DEFAULT 0",
            "price_usd_kg": "FLOAT NOT NULL DEFAULT 0",
            "stock_available_kg": "FLOAT NOT NULL DEFAULT 0",
            "stock_min_kg": "FLOAT NOT NULL DEFAULT 0",
            "min_order_kg": "FLOAT NOT NULL DEFAULT 0",
            "lat": "FLOAT NOT NULL DEFAULT 0",
            "lng": "FLOAT NOT NULL DEFAULT 0",
            "municipality_id": "VARCHAR(80) NOT NULL DEFAULT ''",
            "municipality_name": "VARCHAR(100) NOT NULL DEFAULT ''",
            "image": "TEXT NOT NULL DEFAULT ''",
            "harvest_season": "VARCHAR(120) NOT NULL DEFAULT ''",
            "packaging": "VARCHAR(120) NOT NULL DEFAULT ''",
            "description": "VARCHAR(2000) NOT NULL DEFAULT ''",
            "featured": "BOOLEAN NOT NULL DEFAULT FALSE",
            "producer_experience_years": "FLOAT NOT NULL DEFAULT 0",
        },
    )
    product_columns = {
        column["name"] for column in inspect(db.engine).get_columns("product_listing")
    }
    if "data" in product_columns:
        rows = db.session.execute(
            text("SELECT id, data FROM product_listing")
        ).all()
        for row in rows:
            data = _decode_legacy_object(row.data, "product_listing", row.id)
            listing = db.session.get(ProductListing, row.id)
            if listing is None:
                raise RuntimeError(f"Cannot migrate missing product listing {row.id}.")
            _apply_product_fields(listing, data)
        db.session.commit()
        _drop_legacy_column("product_listing", "data")

    quotation_additions = {
        "product_listing_id": "VARCHAR(36) NULL REFERENCES product_listing(id) ON DELETE SET NULL",
        "product_name": "VARCHAR(120) NOT NULL DEFAULT ''",
        "product_variety": "VARCHAR(120) NOT NULL DEFAULT ''",
        "producer_name": "VARCHAR(160) NOT NULL DEFAULT ''",
        "producer_association": "VARCHAR(200) NOT NULL DEFAULT ''",
        "producer_whatsapp": "VARCHAR(30) NOT NULL DEFAULT ''",
        "client_name": "VARCHAR(160) NOT NULL DEFAULT ''",
        "client_email": "VARCHAR(320) NOT NULL DEFAULT ''",
        "client_phone": "VARCHAR(30) NOT NULL DEFAULT ''",
        "client_business_type": "VARCHAR(40) NOT NULL DEFAULT ''",
        "client_city": "VARCHAR(100) NOT NULL DEFAULT ''",
        "quantity_kg": "FLOAT NOT NULL DEFAULT 0",
        "destination_zone": "VARCHAR(40) NOT NULL DEFAULT ''",
        "freight_cop": "FLOAT NOT NULL DEFAULT 0",
        "subtotal_cop": "FLOAT NOT NULL DEFAULT 0",
        "total_cop": "FLOAT NOT NULL DEFAULT 0",
        "exchange_rate_cop": "FLOAT NOT NULL DEFAULT 4150",
        "discount_percent": "FLOAT NOT NULL DEFAULT 0",
        "notes": "VARCHAR(1000) NOT NULL DEFAULT ''",
    }
    _ensure_columns("quotation_record", quotation_additions)
    quotation_columns = {
        column["name"] for column in inspect(db.engine).get_columns("quotation_record")
    }
    if "data" in quotation_columns:
        rows = db.session.execute(
            text("SELECT id, product_id, data FROM quotation_record")
        ).all()
        field_map = {
            "productName": "product_name",
            "productVariety": "product_variety",
            "producerName": "producer_name",
            "producerAssociation": "producer_association",
            "producerWhatsapp": "producer_whatsapp",
            "clientName": "client_name",
            "clientEmail": "client_email",
            "clientPhone": "client_phone",
            "clientBusinessType": "client_business_type",
            "clientCity": "client_city",
            "quantityKg": "quantity_kg",
            "destinationZone": "destination_zone",
            "freightCop": "freight_cop",
            "subtotalCop": "subtotal_cop",
            "totalCop": "total_cop",
            "discountPercent": "discount_percent",
            "notes": "notes",
        }
        for row in rows:
            data = _decode_legacy_object(row.data, "quotation_record", row.id)
            values = {
                destination: data.get(source, 0 if destination in {
                    "quantity_kg",
                    "freight_cop",
                    "subtotal_cop",
                    "total_cop",
                    "discount_percent",
                } else "")
                for source, destination in field_map.items()
            }
            total_usd = float(data.get("totalUsd", 0) or 0)
            values["exchange_rate_cop"] = (
                float(values["total_cop"]) / total_usd
                if total_usd > 0
                else 4150
            )
            product = db.session.get(ProductListing, row.product_id)
            values["product_listing_id"] = product.id if product else None
            assignments = ", ".join(f'"{name}" = :{name}' for name in values)
            db.session.execute(
                text(
                    f'UPDATE quotation_record SET {assignments} WHERE id = :row_id'
                ),
                {**values, "row_id": row.id},
            )
        db.session.commit()
        _drop_legacy_column("quotation_record", "data")

    _ensure_columns(
        "settings_verification",
        {
            "pending_email": "VARCHAR(320) NULL",
            "pending_name": "VARCHAR(160) NULL",
            "pending_phone": "VARCHAR(30) NULL",
            "pending_notifications_enabled": "BOOLEAN NULL",
            "pending_quote_notifications": "BOOLEAN NULL",
            "pending_response_notifications": "BOOLEAN NULL",
        },
    )
    verification_columns = {
        column["name"] for column in inspect(db.engine).get_columns("settings_verification")
    }
    if "pending_changes" in verification_columns:
        rows = db.session.execute(
            text("SELECT id, pending_changes FROM settings_verification")
        ).all()
        for row in rows:
            changes = _decode_legacy_object(
                row.pending_changes,
                "settings_verification",
                row.id,
            )
            values = {}
            field_map = {
                "email": "pending_email",
                "name": "pending_name",
                "phone": "pending_phone",
            }
            for source, destination in field_map.items():
                if source in changes:
                    values[destination] = changes[source]
            for field_name, value in changes.items():
                if field_name == "notifications":
                    values.update({
                        "pending_notifications_enabled": value["notificationsEnabled"],
                        "pending_quote_notifications": value["quoteNotifications"],
                        "pending_response_notifications": value["responseNotifications"],
                    })
            if values:
                assignments = ", ".join(f'"{name}" = :{name}' for name in values)
                db.session.execute(
                    text(
                        f'UPDATE settings_verification SET {assignments} WHERE id = :row_id'
                    ),
                    {**values, "row_id": row.id},
                )
        db.session.commit()
        _drop_legacy_column("settings_verification", "pending_changes")

    account_settings_columns = {
        column["name"] for column in inspect(db.engine).get_columns("account_settings")
    }
    if "phone" in account_settings_columns:
        rows = db.session.execute(
            text(
                "SELECT account_settings.user_id, account_settings.phone "
                "FROM account_settings JOIN user ON user.id = account_settings.user_id "
                'WHERE user.phone = \'\' AND account_settings.phone <> \'\''
            )
        ).all()
        for row in rows:
            db.session.execute(
                text('UPDATE "user" SET phone = :phone WHERE id = :user_id'),
                {"phone": row.phone, "user_id": row.user_id},
            )
        db.session.commit()
        _drop_legacy_column("account_settings", "phone")


with app.app_context():
    db.create_all()
    _migrate_user_columns()
    _migrate_normalized_tables()
    admin_email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "")
    if bool(admin_email) != bool(admin_password):
        raise RuntimeError("Configura ADMIN_EMAIL y ADMIN_PASSWORD juntos.")
    if admin_email:
        if len(admin_password) < 12:
            raise RuntimeError("ADMIN_PASSWORD debe tener al menos 12 caracteres.")
        configured_admin = User.query.filter_by(email=admin_email).first()
        if configured_admin is None:
            configured_admin = User(
                google_sub=f"local:{uuid.uuid4()}",
                email=admin_email,
                name="Administración AgroCórdoba",
                password_hash=generate_password_hash(admin_password),
                role="admin",
                status="activo",
            )
            db.session.add(configured_admin)
            db.session.commit()
        elif configured_admin.role != "admin":
            raise RuntimeError(
                "ADMIN_EMAIL pertenece a una cuenta que no es administradora."
            )


@app.cli.command("create-admin")
def create_admin_command():
    """Create a real administrator account for the SQLite-backed admin panel."""
    email = click.prompt("Correo del administrador").strip().lower()
    if len(email) > 320 or "@" not in email or "." not in email.rsplit("@", 1)[-1]:
        raise click.ClickException("Escribe un correo válido.")
    if User.query.filter_by(email=email).first():
        raise click.ClickException("Ya existe una cuenta con ese correo; no se modificó.")
    password = click.prompt("Contraseña nueva (mínimo 12 caracteres)", hide_input=True, confirmation_prompt=True)
    if len(password) < 12:
        raise click.ClickException("La contraseña del administrador debe tener al menos 12 caracteres.")
    admin = User(
        google_sub=f"local:{uuid.uuid4()}",
        email=email,
        name="Administración AgroCórdoba",
        password_hash=generate_password_hash(password),
        role="admin",
        status="activo",
    )
    db.session.add(admin)
    db.session.commit()
    click.echo("Cuenta de administrador creada. Ya puedes iniciar sesión desde el sitio.")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=os.environ.get("FLASK_DEBUG") == "true")
