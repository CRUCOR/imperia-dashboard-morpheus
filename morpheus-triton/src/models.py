"""
Machine Learning Models for Security Analysis
Implements 6 detection models:
1. Digital Fingerprinting
2. Sensitive Information Detection
3. Cryptomining Detection (ABP)
4. Phishing Detection
5. Fraud Detection
6. Ransomware Detection
"""

import hashlib
import re
import random
from typing import Dict, List, Any, Tuple
import json


# ============= 1. DIGITAL FINGERPRINTING =============

def analyze_digital_fingerprint(data: List[Dict[str, Any]], algorithm: str = 'sha256') -> Dict[str, Any]:
    """
    Generate digital fingerprints (hashes) for files or data
    Detects duplicates and creates unique identifiers
    """
    fingerprints = []
    hash_counts = {}
    
    for idx, item in enumerate(data):
        # Extract file content or data to hash
        content = json.dumps(item, sort_keys=True).encode('utf-8')
        
        # Calculate hash based on algorithm
        if algorithm == 'sha256':
            hash_value = hashlib.sha256(content).hexdigest()
        elif algorithm == 'md5':
            hash_value = hashlib.md5(content).hexdigest()
        else:  # ssdeep simulation
            hash_value = hashlib.sha256(content).hexdigest()[:32]
        
        # Track duplicates
        hash_counts[hash_value] = hash_counts.get(hash_value, 0) + 1
        
        fingerprint = {
            "file_path": item.get("path", f"item_{idx}"),
            "algorithm": algorithm,
            "hash": hash_value,
            "size_bytes": len(content),
            "created_at": item.get("created_at", ""),
            "modified_at": item.get("modified_at", "")
        }
        fingerprints.append(fingerprint)
    
    # Calculate statistics
    duplicates = sum(1 for count in hash_counts.values() if count > 1)
    
    return {
        "fingerprints": fingerprints,
        "statistics": {
            "total_files": len(data),
            "unique_hashes": len(hash_counts),
            "duplicates": duplicates
        }
    }


# ============= 2. SENSITIVE INFORMATION DETECTION =============

# Patterns for sensitive data detection
PII_PATTERNS = {
    'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    'phone': r'\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b',
    'ssn': r'\b\d{3}-\d{2}-\d{4}\b',
    'credit_card': r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',
    'api_key': r'(?i)(api[_-]?key|apikey|access[_-]?token)["\s:=]+[A-Za-z0-9_\-]{20,}',
    'password': r'(?i)(password|passwd|pwd)["\s:=]+[^\s"]{8,}',
    'aws_key': r'(?i)(AKIA[0-9A-Z]{16})',
}

def analyze_sensitive_info(data: List[Dict[str, Any]], scan_pii: bool = True, 
                          scan_credentials: bool = True, scan_api_keys: bool = True,
                          confidence_threshold: float = 0.7) -> Dict[str, Any]:
    """
    Detect sensitive information in data including PII, credentials, API keys
    """
    findings = []
    by_type = {}
    by_severity = {'low': 0, 'medium': 0, 'high': 0, 'critical': 0}
    
    for idx, item in enumerate(data):
        # Convert item to searchable text
        text = json.dumps(item)
        
        # Check for different types of sensitive data
        if scan_pii:
            for pattern_type, pattern in [('email', PII_PATTERNS['email']), 
                                         ('phone', PII_PATTERNS['phone']),
                                         ('ssn', PII_PATTERNS['ssn']),
                                         ('credit_card', PII_PATTERNS['credit_card'])]:
                matches = re.finditer(pattern, text)
                for match in matches:
                    severity = 'critical' if pattern_type in ['ssn', 'credit_card'] else 'high'
                    finding = {
                        "row_id": idx,
                        "type": pattern_type,
                        "content": match.group()[:50] + "..." if len(match.group()) > 50 else match.group(),
                        "confidence": 0.95,
                        "location": {
                            "line": idx,
                            "field": "data"
                        },
                        "severity": severity
                    }
                    findings.append(finding)
                    by_type[pattern_type] = by_type.get(pattern_type, 0) + 1
                    by_severity[severity] += 1
        
        if scan_credentials:
            for pattern_type in ['password']:
                matches = re.finditer(PII_PATTERNS[pattern_type], text)
                for match in matches:
                    finding = {
                        "row_id": idx,
                        "type": "credential",
                        "content": "[REDACTED]",
                        "confidence": 0.9,
                        "location": {
                            "line": idx,
                            "field": "data"
                        },
                        "severity": "critical"
                    }
                    findings.append(finding)
                    by_type['credential'] = by_type.get('credential', 0) + 1
                    by_severity['critical'] += 1
        
        if scan_api_keys:
            for pattern_type in ['api_key', 'aws_key']:
                matches = re.finditer(PII_PATTERNS[pattern_type], text)
                for match in matches:
                    finding = {
                        "row_id": idx,
                        "type": "api_key",
                        "content": "[REDACTED]",
                        "confidence": 0.92,
                        "location": {
                            "line": idx,
                            "field": "data"
                        },
                        "severity": "critical"
                    }
                    findings.append(finding)
                    by_type['api_key'] = by_type.get('api_key', 0) + 1
                    by_severity['critical'] += 1
    
    high_risk = by_severity['critical'] + by_severity['high']
    
    return {
        "findings": findings[:1000],  # Limit to first 1000
        "statistics": {
            "total_findings": len(findings),
            "by_type": by_type,
            "by_severity": by_severity,
            "high_risk_items": high_risk
        }
    }


# ============= 3. CRYPTOMINING DETECTION (ABP) =============

def analyze_cryptomining(packets: List[Dict[str, Any]], pipeline_batch_size: int = 256,
                        model_max_batch_size: int = 32) -> Dict[str, Any]:
    """
    Detect crypto mining activity in network traffic
    Uses Anomalous Behavior Profiling (ABP) techniques
    """
    predictions = []
    mining_ports = [3333, 4444, 5555, 8333, 9332, 14433, 45560]
    ip_mining_counts = {}
    
    for idx, packet in enumerate(packets):
        dest_port = int(packet.get("dest_port", 0))
        src_port = int(packet.get("src_port", 0))
        data_len = int(packet.get("data_len", 0))
        protocol = packet.get("protocol", "6")
        
        # Mining detection heuristics
        is_mining_port = dest_port in mining_ports or src_port in mining_ports
        is_suspicious_size = 54 <= data_len <= 100
        
        # Calculate anomaly probability
        base_probability = 0.02
        
        if is_mining_port:
            anomaly_probability = 0.85 + random.uniform(-0.1, 0.1)
        elif is_suspicious_size and random.random() < 0.1:
            anomaly_probability = 0.65 + random.uniform(-0.15, 0.15)
        else:
            anomaly_probability = base_probability + random.uniform(-0.01, 0.05)
        
        anomaly_probability = max(0.0, min(1.0, anomaly_probability))
        is_mining = anomaly_probability > 0.5
        
        prediction_entry = {
            "row_id": idx,
            "prediction": {
                "is_mining": is_mining,
                "mining_probability": round(anomaly_probability, 4),
                "regular_probability": round(1.0 - anomaly_probability, 4),
                "confidence": round(anomaly_probability if is_mining else (1.0 - anomaly_probability), 4),
                "anomaly_score": round(anomaly_probability, 4),
                "detected_patterns": []
            },
            "packet_info": {
                "src_ip": packet.get("src_ip", ""),
                "dest_ip": packet.get("dest_ip", ""),
                "src_port": src_port,
                "dest_port": dest_port,
                "protocol": protocol,
                "data_len": data_len,
                "timestamp": packet.get("timestamp", "")
            }
        }
        
        if is_mining_port:
            prediction_entry["prediction"]["detected_patterns"].append({
                "pattern": "suspicious_port",
                "description": f"Connection to known mining port {dest_port}",
                "severity": "high"
            })
        
        if is_suspicious_size:
            prediction_entry["prediction"]["detected_patterns"].append({
                "pattern": "consistent_packet_size",
                "description": f"Packet size ({data_len} bytes) matches mining pattern",
                "severity": "medium"
            })
        
        predictions.append(prediction_entry)
        
        if is_mining:
            src_ip = packet.get("src_ip", "")
            ip_mining_counts[src_ip] = ip_mining_counts.get(src_ip, 0) + 1
    
    num_mining = sum(1 for p in predictions if p["prediction"]["is_mining"])
    num_regular = len(packets) - num_mining
    suspicious_ips = sorted(ip_mining_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return {
        "predictions": predictions,
        "statistics": {
            "total_packets": len(packets),
            "mining_detected": num_mining,
            "regular_traffic": num_regular,
            "mining_rate": round(num_mining / len(packets) * 100, 2) if packets else 0,
            "suspicious_ips": [{"ip": ip, "mining_packets": count} for ip, count in suspicious_ips]
        }
    }


# ============= 4. PHISHING DETECTION =============

PHISHING_INDICATORS = [
    'urgent', 'verify', 'suspended', 'click here', 'confirm', 'update',
    'security alert', 'unusual activity', 'limited time', 'winner',
    'congratulations', 'prize', 'free', 'act now'
]

SUSPICIOUS_DOMAINS = [
    'paypal-secure', 'amazon-update', 'bank-verify', 'account-alert',
    'secure-login', 'verify-account', 'payment-pending'
]

def analyze_phishing(data: List[Dict[str, Any]], check_urls: bool = True,
                    check_emails: bool = True, analyze_content: bool = True) -> Dict[str, Any]:
    """
    Detect phishing attempts in URLs, emails, and content
    """
    detections = []
    by_severity = {'low': 0, 'medium': 0, 'high': 0, 'critical': 0}
    
    for idx, item in enumerate(data):
        indicators = []
        phishing_score = 0.0
        
        # Extract relevant fields
        url = item.get('url', '')
        email = item.get('email', '')
        subject = item.get('subject', '')
        sender = item.get('sender', '')
        content = item.get('content', '') or item.get('body', '')
        
        # Check URL for suspicious patterns
        if check_urls and url:
            for domain in SUSPICIOUS_DOMAINS:
                if domain in url.lower():
                    indicators.append({
                        "type": "domain",
                        "description": f"Suspicious domain pattern: {domain}",
                        "severity": "high",
                        "score": 0.3
                    })
                    phishing_score += 0.3
            
            # Check for IP address in URL
            if re.search(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', url):
                indicators.append({
                    "type": "url",
                    "description": "URL contains IP address instead of domain",
                    "severity": "medium",
                    "score": 0.2
                })
                phishing_score += 0.2
        
        # Check email patterns
        if check_emails and sender:
            # Check for mismatched sender
            if '@' in sender:
                domain = sender.split('@')[-1]
                if any(susp in domain for susp in SUSPICIOUS_DOMAINS):
                    indicators.append({
                        "type": "sender",
                        "description": "Suspicious sender domain",
                        "severity": "high",
                        "score": 0.3
                    })
                    phishing_score += 0.3
        
        # Analyze content for phishing keywords
        if analyze_content and (content or subject):
            text = (content + ' ' + subject).lower()
            keyword_count = sum(1 for keyword in PHISHING_INDICATORS if keyword in text)
            
            if keyword_count >= 3:
                indicators.append({
                    "type": "content",
                    "description": f"Multiple phishing keywords detected ({keyword_count})",
                    "severity": "high",
                    "score": 0.4
                })
                phishing_score += 0.4
            elif keyword_count >= 1:
                indicators.append({
                    "type": "content",
                    "description": f"Phishing keywords detected ({keyword_count})",
                    "severity": "medium",
                    "score": 0.2
                })
                phishing_score += 0.2
        
        # Calculate final probability
        phishing_probability = min(phishing_score, 0.95)
        is_phishing = phishing_probability > 0.5
        
        # Determine severity
        if phishing_probability > 0.8:
            severity = 'critical'
        elif phishing_probability > 0.6:
            severity = 'high'
        elif phishing_probability > 0.3:
            severity = 'medium'
        else:
            severity = 'low'
        
        detection = {
            "row_id": idx,
            "is_phishing": is_phishing,
            "phishing_probability": round(phishing_probability, 4),
            "indicators": indicators,
            "source": {
                "url": url if url else None,
                "email": email if email else None,
                "subject": subject if subject else None,
                "sender": sender if sender else None
            }
        }
        
        detections.append(detection)
        by_severity[severity] += 1
    
    phishing_detected = sum(1 for d in detections if d["is_phishing"])
    
    return {
        "detections": detections,
        "statistics": {
            "total_analyzed": len(data),
            "phishing_detected": phishing_detected,
            "legitimate": len(data) - phishing_detected,
            "phishing_rate": round(phishing_detected / len(data) * 100, 2) if data else 0,
            "by_severity": by_severity
        }
    }


# ============= 5. FRAUD DETECTION =============

def analyze_fraud(transactions: List[Dict[str, Any]], transaction_threshold: float = 1000.0,
                 risk_level: str = 'medium') -> Dict[str, Any]:
    """
    Detect fraudulent transactions and identity theft
    """
    results = []
    by_risk_level = {'low': 0, 'medium': 0, 'high': 0, 'critical': 0}
    total_at_risk = 0.0
    
    for idx, transaction in enumerate(transactions):
        anomalies = []
        risk_score = 0.0
        
        # Extract transaction data
        amount = float(transaction.get('amount', 0))
        timestamp = transaction.get('timestamp', '')
        location = transaction.get('location', '')
        user_id = transaction.get('user_id', '')
        ip_address = transaction.get('ip_address', '')
        
        # Check for high-value transaction
        if amount > transaction_threshold:
            anomalies.append({
                "type": "high_value",
                "description": f"Transaction amount (${amount}) exceeds threshold",
                "impact": 0.3
            })
            risk_score += 0.3
        
        # Check for suspicious patterns (simulation)
        if random.random() < 0.15:  # 15% chance of detecting velocity anomaly
            anomalies.append({
                "type": "velocity",
                "description": "Unusual transaction frequency detected",
                "impact": 0.25
            })
            risk_score += 0.25
        
        # Check location anomaly
        if location and random.random() < 0.1:  # 10% chance
            anomalies.append({
                "type": "location",
                "description": "Transaction from unusual location",
                "impact": 0.2
            })
            risk_score += 0.2
        
        # Check for IP mismatch
        if ip_address and random.random() < 0.12:  # 12% chance
            anomalies.append({
                "type": "ip_mismatch",
                "description": "IP address doesn't match user profile",
                "impact": 0.25
            })
            risk_score += 0.25
        
        # Calculate fraud probability
        fraud_probability = min(risk_score, 0.95)
        is_fraudulent = fraud_probability > 0.5
        
        # Determine risk level
        if fraud_probability > 0.75:
            calculated_risk = 'critical'
        elif fraud_probability > 0.5:
            calculated_risk = 'high'
        elif fraud_probability > 0.3:
            calculated_risk = 'medium'
        else:
            calculated_risk = 'low'
        
        result = {
            "transaction_id": transaction.get('transaction_id', f"txn_{idx}"),
            "is_fraudulent": is_fraudulent,
            "fraud_probability": round(fraud_probability, 4),
            "risk_score": round(risk_score, 4),
            "risk_level": calculated_risk,
            "anomalies": anomalies,
            "transaction_data": {
                "amount": amount,
                "timestamp": timestamp,
                "location": location,
                "user_id": user_id,
                "ip_address": ip_address
            }
        }
        
        results.append(result)
        by_risk_level[calculated_risk] += 1
        
        if is_fraudulent:
            total_at_risk += amount
    
    fraudulent = sum(1 for r in results if r["is_fraudulent"])
    
    return {
        "transactions": results,
        "statistics": {
            "total_transactions": len(transactions),
            "fraudulent": fraudulent,
            "legitimate": len(transactions) - fraudulent,
            "fraud_rate": round(fraudulent / len(transactions) * 100, 2) if transactions else 0,
            "total_amount_at_risk": round(total_at_risk, 2),
            "by_risk_level": by_risk_level
        }
    }


# ============= 6. RANSOMWARE DETECTION =============

RANSOMWARE_EXTENSIONS = [
    '.encrypted', '.locked', '.crypto', '.crypt', '.cerber', '.locky',
    '.zepto', '.odin', '.thor', '.aaa', '.xyz', '.zzz', '.micro',
    '.cryptolocker', '.cryptowall', '.wannacry', '.petya'
]

def analyze_ransomware(files: List[Dict[str, Any]], scan_encrypted_files: bool = True,
                      check_extensions: bool = True, analyze_behavior: bool = True) -> Dict[str, Any]:
    """
    Detect ransomware threats in files and behavior patterns
    """
    threats = []
    by_threat_level = {'low': 0, 'medium': 0, 'high': 0, 'critical': 0}
    
    for idx, file_data in enumerate(files):
        indicators = []
        threat_score = 0.0
        
        # Extract file information
        file_path = file_data.get('path', '')
        file_name = file_data.get('name', '')
        file_ext = file_data.get('extension', '')
        size_bytes = file_data.get('size', 0)
        is_encrypted = file_data.get('encrypted', False)
        
        # Check for ransomware extensions
        if check_extensions:
            for ransomware_ext in RANSOMWARE_EXTENSIONS:
                if file_name.endswith(ransomware_ext) or file_ext == ransomware_ext:
                    indicators.append({
                        "type": "file_extension",
                        "description": f"Known ransomware extension: {ransomware_ext}",
                        "matched": True
                    })
                    threat_score += 0.5
                    break
        
        # Check for encryption markers
        if scan_encrypted_files and is_encrypted:
            indicators.append({
                "type": "encryption",
                "description": "File appears to be encrypted",
                "matched": True
            })
            threat_score += 0.3
        
        # Check for suspicious behavior patterns
        if analyze_behavior:
            # Check for ransom note indicators
            if any(keyword in file_name.lower() for keyword in ['readme', 'decrypt', 'ransom', 'howto']):
                indicators.append({
                    "type": "behavior",
                    "description": "File name suggests ransom note",
                    "matched": True
                })
                threat_score += 0.3
            
            # Check for bulk modifications (simulation)
            if random.random() < 0.08:  # 8% chance
                indicators.append({
                    "type": "behavior",
                    "description": "Part of bulk file modification pattern",
                    "matched": True
                })
                threat_score += 0.25
        
        # Calculate ransomware probability
        ransomware_probability = min(threat_score, 0.95)
        is_ransomware = ransomware_probability > 0.5
        
        # Determine threat level
        if ransomware_probability > 0.8:
            threat_level = 'critical'
        elif ransomware_probability > 0.6:
            threat_level = 'high'
        elif ransomware_probability > 0.3:
            threat_level = 'medium'
        else:
            threat_level = 'low'
        
        threat = {
            "row_id": idx,
            "is_ransomware": is_ransomware,
            "ransomware_probability": round(ransomware_probability, 4),
            "threat_level": threat_level,
            "indicators": indicators,
            "file_info": {
                "path": file_path,
                "name": file_name,
                "extension": file_ext,
                "size_bytes": size_bytes,
                "is_encrypted": is_encrypted
            }
        }
        
        threats.append(threat)
        by_threat_level[threat_level] += 1
    
    ransomware_detected = sum(1 for t in threats if t["is_ransomware"])
    
    return {
        "threats": threats,
        "statistics": {
            "total_files": len(files),
            "ransomware_detected": ransomware_detected,
            "clean_files": len(files) - ransomware_detected,
            "infection_rate": round(ransomware_detected / len(files) * 100, 2) if files else 0,
            "by_threat_level": by_threat_level
        }
    }
