<?php
declare(strict_types=1);
/* SHOWSET Studio PHP / MySQL backend. Deploy to /api/showset/index.php. */
ini_set('display_errors','0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store, max-age=0');
header('Content-Type: application/json; charset=utf-8');
$local = __DIR__ . '/config.local.php';
if (!is_file($local)) { http_response_code(503); echo json_encode(['ok'=>false,'error'=>'Backend not configured']); exit; }
$config = require $local;
if(!is_array($config)) {http_response_code(503);exit;}
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off');
ini_set('session.use_strict_mode','1');
session_name('SHOWSETSTUDIO');
session_set_cookie_params(['lifetime'=>0,'path'=>'/api/showset/','secure'=>$https,'httponly'=>true,'samesite'=>'Strict']);
session_start();
function respond(array $payload,int $code=200):never {http_response_code($code);echo json_encode($payload,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
function db():PDO {global $config;static $pdo=null;if($pdo)return $pdo;
 $dsn='mysql:host='.$config['db_host'].';port='.($config['db_port']??3306).';dbname='.$config['db_name'].';charset=utf8mb4';
 try{$pdo=new PDO($dsn,$config['db_user'],$config['db_pass'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);}catch(Throwable $e){respond(['ok'=>false,'error'=>'Database unavailable'],503);}return $pdo;}
function authorized():bool{return !empty($_SESSION['showset_auth'])&&$_SESSION['showset_auth']===true;}
function require_auth():void{if(!authorized())respond(['ok'=>false,'error'=>'Authentication required'],401);}
function same_origin():bool {if(empty($_SERVER['HTTP_ORIGIN']))return true; $origin=parse_url($_SERVER['HTTP_ORIGIN']);return is_array($origin)&&strtolower($origin['host']??'')===strtolower(explode(':',$_SERVER['HTTP_HOST']??'')[0]);}
function require_post():void{if($_SERVER['REQUEST_METHOD']!=='POST')respond(['ok'=>false,'error'=>'POST required'],405);if(!same_origin())respond(['ok'=>false,'error'=>'Invalid origin'],403);}
function csrf():void {if(empty($_SESSION['csrf'])||!hash_equals($_SESSION['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??''))respond(['ok'=>false,'error'=>'Invalid security token'],403);}
function payload():array{$raw=file_get_contents('php://input');if(strlen($raw)>1000000)respond(['ok'=>false,'error'=>'Payload too large'],413);$data=json_decode($raw,true);if(!is_array($data))respond(['ok'=>false,'error'=>'Invalid JSON'],400);return $data;}
function limit(string $key,int $max,int $period):bool {$stmt=db()->prepare('SELECT count,window_start FROM showset_rate_limits WHERE limit_key=?');$stmt->execute([$key]);$v=$stmt->fetch();$now=time();if(!$v||$now-(int)$v['window_start']>$period){$q=db()->prepare('INSERT INTO showset_rate_limits(limit_key,count,window_start) VALUES (?,1,?) ON DUPLICATE KEY UPDATE count=1,window_start=?');$q->execute([$key,$now,$now]);return true;}if((int)$v['count']>=$max)return false;db()->prepare('UPDATE showset_rate_limits SET count=count+1 WHERE limit_key=?')->execute([$key]);return true;}
function slug(string $s):string{if(!preg_match('/^[a-z0-9-]{1,80}$/',$s))respond(['ok'=>false,'error'=>'Invalid page slug'],400);return $s;}
function valid_page($d):bool{if(!is_array($d)||empty($d['sections'])||!is_array($d['sections'])||count($d['sections'])>65)return false;$valid=['hero','pagehero','split','story','services','work','dot','cta','visual','items','accordion','contact'];foreach($d['sections'] as $s){if(!is_array($s)||!in_array($s['type']??'',$valid,true))return false;if(strlen(json_encode($s))>220000)return false;}return true;}
function get_entity(string $sql, array $params):?array{$q=db()->prepare($sql);$q->execute($params);$row=$q->fetch();return $row?:null;}
function read_settings(bool $published):?array {$row=get_entity('SELECT draft_json,published_json FROM showset_settings WHERE id=1',[]);if(!$row)return null;$value=$published?$row['published_json']:$row['draft_json'];return $value?json_decode($value,true):null;}
function store_settings(array $globals,bool $publish):void{$js=json_encode($globals,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);if(strlen($js)>200000)respond(['ok'=>false,'error'=>'Settings too large'],413);
 $q=db()->prepare('INSERT INTO showset_settings(id,draft_json,published_json) VALUES(1,?,?) ON DUPLICATE KEY UPDATE draft_json=VALUES(draft_json)'.($publish?',published_json=VALUES(published_json)':''));$q->execute([$js,$publish?$js:null]);
 db()->prepare('INSERT INTO showset_revisions(entity_type,entity_slug,data_json,published) VALUES(?,?,?,?)')->execute(['settings','global',$js,$publish?1:0]);}
$action=$_GET['action']??'';
try {
 if($action==='session')respond(['ok'=>true,'authenticated'=>authorized(),'csrf'=>authorized()?($_SESSION['csrf']??''):null]);
 if($action==='login') {require_post();$d=payload();$ip=hash('sha256',$_SERVER['REMOTE_ADDR']??'unknown');if(!limit('login:'.substr($ip,0,55),8,900))respond(['ok'=>false,'error'=>'Too many attempts. Try later.'],429);
  if(!hash_equals((string)$config['admin_user'],(string)($d['username']??''))||!password_verify((string)($d['password']??''),(string)$config['admin_password_hash']))respond(['ok'=>false,'error'=>'Invalid credentials'],401);
  session_regenerate_id(true);$_SESSION['showset_auth']=true;$_SESSION['csrf']=bin2hex(random_bytes(24));respond(['ok'=>true,'csrf'=>$_SESSION['csrf']]);}
 if($action==='logout'){require_post();require_auth();csrf();$_SESSION=[];session_destroy();respond(['ok'=>true]);}
 if($action==='published'){$key=slug((string)($_GET['slug']??''));$row=get_entity('SELECT published_json FROM showset_pages WHERE slug=?',[$key]);$page=($row&&!empty($row['published_json']))?json_decode($row['published_json'],true):null;respond(['ok'=>true,'page'=>$page,'globals'=>read_settings(true)]);}
 if($action==='draft'){require_auth();$key=slug((string)($_GET['slug']??''));$row=get_entity('SELECT draft_json FROM showset_pages WHERE slug=?',[$key]);respond(['ok'=>true,'page'=>$row?json_decode($row['draft_json'],true):null,'globals'=>read_settings(false)]);}
 if($action==='history'){require_auth();$key=slug((string)($_GET['slug']??''));$q=db()->prepare('SELECT id,published,created_at FROM showset_revisions WHERE entity_type=? AND entity_slug=? ORDER BY id DESC LIMIT 30');$q->execute(['page',$key]);respond(['ok'=>true,'items'=>$q->fetchAll()]);}
 if($action==='save'||$action==='publish'){
  require_post();require_auth();csrf();$d=payload();$key=slug((string)($d['slug']??''));$page=$d['page']??null;$globals=$d['globals']??null;
  if(!valid_page($page)||!is_array($globals)||!isset($globals['theme'],$globals['header']))respond(['ok'=>false,'error'=>'Invalid page or global settings'],400);
  if(($page['slug']??'')!==$key)respond(['ok'=>false,'error'=>'Page mismatch'],400);
  $js=json_encode($page,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);if(strlen($js)>900000)respond(['ok'=>false,'error'=>'Page too large'],413);
  $pub=$action==='publish';db()->beginTransaction();
  $sql='INSERT INTO showset_pages(slug,draft_json,published_json) VALUES(?,?,?) ON DUPLICATE KEY UPDATE draft_json=VALUES(draft_json)'.($pub?',published_json=VALUES(published_json)':'');
  db()->prepare($sql)->execute([$key,$js,$pub?$js:null]);
  db()->prepare('INSERT INTO showset_revisions(entity_type,entity_slug,data_json,published) VALUES(?,?,?,?)')->execute(['page',$key,$js,$pub?1:0]);store_settings($globals,$pub);db()->commit();respond(['ok'=>true,'published'=>$pub]);}
 if($action==='upload') {require_post();require_auth();csrf();if(empty($_FILES['file'])||!is_uploaded_file($_FILES['file']['tmp_name']))respond(['ok'=>false,'error'=>'No image'],400);
  $f=$_FILES['file'];if($f['error']!==UPLOAD_ERR_OK||$f['size']>($config['max_upload_bytes']??5000000))respond(['ok'=>false,'error'=>'File too large'],413);
  $mime=(new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);$allowed=['image/png'=>'png','image/jpeg'=>'jpg','image/webp'=>'webp'];if(!isset($allowed[$mime])||!getimagesize($f['tmp_name']))respond(['ok'=>false,'error'=>'Unsupported image'],415);
  $base=dirname(__DIR__,2);$siteRoot=is_dir($base.'/protected-site')?$base.'/protected-site':$base;$path=$siteRoot.'/media/uploads';if(!is_dir($path)&&!mkdir($path,0755,true))respond(['ok'=>false,'error'=>'Upload directory unavailable'],503);
  $name=bin2hex(random_bytes(18)).'.'.$allowed[$mime];if(!move_uploaded_file($f['tmp_name'],$path.'/'.$name))respond(['ok'=>false,'error'=>'Unable to save image'],503);chmod($path.'/'.$name,0644);respond(['ok'=>true,'url'=>'/media/uploads/'.$name]);}
 if($action==='enquiry'){require_post();$ip=hash('sha256',$_SERVER['REMOTE_ADDR']??'unknown');if(!limit('contact:'.substr($ip,0,55),6,3600))respond(['ok'=>false,'error'=>'Too many requests'],429);
  $name=trim((string)($_POST['name']??''));$email=trim((string)($_POST['email']??''));$msg=trim((string)($_POST['message']??''));$trap=(string)($_POST['website']??'');
  if($trap!=='')respond(['ok'=>true]);if(mb_strlen($name)>120||!filter_var($email,FILTER_VALIDATE_EMAIL)||mb_strlen($msg)<3||mb_strlen($msg)>5000)respond(['ok'=>false,'error'=>'Please check the form fields'],422);
  $to=trim((string)($config['contact_email']??''));if(!$to||!filter_var($to,FILTER_VALIDATE_EMAIL))respond(['ok'=>false,'error'=>'Form not configured'],503);
  $details="Name: $name\nEmail: $email\nCompany: ".(string)($_POST['company']??'')."\nCategory: ".(string)($_POST['category']??'')."\nDate: ".(string)($_POST['date']??'')."\nBudget: ".(string)($_POST['budget']??'')."\n\nMessage:\n$msg";
  $sent=mail($to,'SHOWSET website enquiry',str_replace(["\r","\0"],'',$details),'From: SHOWSET Website <no-reply@showset.co.za>' . "\r\n" . 'Reply-To: '.str_replace(["\r","\n"],'',$email));
  if(!$sent)respond(['ok'=>false,'error'=>'Unable to send enquiry'],503);respond(['ok'=>true]);}
 respond(['ok'=>false,'error'=>'Unknown action'],404);
} catch(Throwable $e){if(db()->inTransaction())db()->rollBack();error_log('SHOWSET backend: '.$e->getMessage());respond(['ok'=>false,'error'=>'Server error'],500);}
