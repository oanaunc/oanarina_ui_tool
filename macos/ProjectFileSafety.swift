import Foundation
import CryptoKit
import Darwin

/** Cooperates with the local MCP writer without ever sending filesystem paths to WebKit. */
enum ProjectFileSafety {
    enum Result {case written;case conflict(String?)}
    static func fingerprint(_ data:Data)->String {SHA256.hash(data:data).map{String(format:"%02x",$0)}.joined()}
    static func readBounded(_ url:URL)throws->Data {
        let descriptor=Darwin.open(url.path,O_RDONLY|O_NOFOLLOW|O_NONBLOCK|O_NOCTTY)
        guard descriptor>=0 else{throw NSError(domain:NSPOSIXErrorDomain,code:Int(errno))}
        defer{Darwin.close(descriptor)}
        var info=stat();guard fstat(descriptor,&info)==0 else{throw NSError(domain:NSPOSIXErrorDomain,code:Int(errno))}
        guard info.st_mode & S_IFMT == S_IFREG,info.st_size>=0,info.st_size<50_000_000 else{throw NSError(domain:"Choose a regular project file smaller than 50 MB.",code:1)}
        let handle=FileHandle(fileDescriptor:descriptor,closeOnDealloc:false);var data=Data()
        while let chunk=try handle.read(upToCount:min(65536,50_000_000-data.count+1)),!chunk.isEmpty{data.append(chunk);if data.count>=50_000_000{throw NSError(domain:"Project exceeds the 50 MB limit.",code:2)}}
        return data
    }
    static func current(_ url:URL)throws->String? {
        do{return fingerprint(try readBounded(url))}catch let error as NSError{if error.domain==NSPOSIXErrorDomain&&error.code==Int(ENOENT){return nil};throw error}
    }
    static func write(_ data:Data,to url:URL,expected:String?,checkRevision:Bool)throws->Result {
        let lock=url.path+".oanarina-mcp.lock"
        let descriptor=Darwin.open(lock,O_WRONLY|O_CREAT|O_EXCL,mode_t(0o600))
        guard descriptor>=0 else{if errno==EEXIST{throw NSError(domain:"Another project transaction is in progress. Retry after it finishes. A lock left by a crashed process requires manual removal.",code:3)};throw NSError(domain:NSPOSIXErrorDomain,code:Int(errno))}
        var owner=stat();guard fstat(descriptor,&owner)==0 else{Darwin.close(descriptor);throw NSError(domain:NSPOSIXErrorDomain,code:Int(errno))}
        defer{var actual=stat();if lstat(lock,&actual)==0&&actual.st_dev==owner.st_dev&&actual.st_ino==owner.st_ino{Darwin.unlink(lock)};Darwin.close(descriptor)}
        let marker=Data("{\"pid\":\(ProcessInfo.processInfo.processIdentifier),\"writer\":\"Forma\"}".utf8)
        _ = marker.withUnsafeBytes{Darwin.write(descriptor,$0.baseAddress,$0.count)}
        if checkRevision{let actual=try current(url);if actual != expected{return .conflict(actual)}}
        try data.write(to:url,options:.atomic)
        return .written
    }
}
